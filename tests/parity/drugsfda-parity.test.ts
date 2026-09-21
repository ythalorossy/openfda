import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drugDrugsfda } from '../../src/datasets/drug/drugsfda';
import { execute } from '../../src/core/executor';
import { getDrugsfda } from '../../src/drug/get-drugsfda';
import { SECTIONS, resolveField } from '../../src/drug/drugsfda-sections';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const APPLICATION = {
  application_number: 'NDA020235',
  sponsor_name: 'PFIZER',
  products: [{ product_number: '001' }],
  submissions: [{ submission_number: '1' }],
};
const page = { body: { meta: { results: { total: 3 } }, results: [APPLICATION] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

const NOTE_PATH = join(
  process.cwd(),
  'docs/superpowers/notes/2026-09-20-field-selection.md'
);

/**
 * Extract every backtick-quoted path named in the `## drugsfda` section's
 * "Deliberately not exposed" block of the field-selection note. Reads the
 * note's structure, not a hardcoded list of the seven dropped 1.x paths —
 * `parses arbitrary note content, not a hardcoded list` below proves this
 * against synthetic content, and this same function is what the "reachable
 * or deliberately dropped" test runs against the real note.
 */
function parseDeliberatelyNotExposed(noteText: string): Set<string> {
  const headingMatch = noteText.match(/^## drugsfda\b.*$/m);
  if (!headingMatch) {
    throw new Error('"## drugsfda" heading not found in field-selection note');
  }
  const afterHeading = noteText.slice(headingMatch.index! + headingMatch[0].length);
  const nextHeadingIndex = afterHeading.search(/\n## /);
  const sectionText =
    nextHeadingIndex === -1 ? afterHeading : afterHeading.slice(0, nextHeadingIndex);

  const marker = '**Deliberately not exposed**';
  const markerIndex = sectionText.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('"Deliberately not exposed" block not found under "## drugsfda"');
  }
  const afterMarker = sectionText.slice(markerIndex + marker.length);
  const endMarkerIndex = afterMarker.search(/\*\*Deviations from the plan/);
  const block = endMarkerIndex === -1 ? afterMarker : afterMarker.slice(0, endMarkerIndex);

  // Each dropped path is named at the START of its bullet, as one or more
  // `path` (coverage%) entries joined by ",", "/" or "and", before the
  // em-dash that introduces the prose explanation. Paths mentioned later,
  // in that prose (e.g. "already covered by `application_number`"), must
  // NOT be picked up, so this only reads the head of each bullet line
  // rather than every backtick span in the block.
  const bulletHead =
    /^-\s*(?:\*\*)?((?:`[a-zA-Z0-9_.]+`(?:\s*\([\d.]+\))?[\s,/]*(?:and\s+)?)+)/gm;
  const pathInHead = /`([a-zA-Z0-9_.]+)`/g;

  const paths = new Set<string>();
  let bulletMatch: RegExpExecArray | null;
  while ((bulletMatch = bulletHead.exec(block)) !== null) {
    const head = bulletMatch[1]!;
    let pathMatch: RegExpExecArray | null;
    while ((pathMatch = pathInHead.exec(head)) !== null) {
      paths.add(pathMatch[1]!);
    }
  }
  return paths;
}

describe('parseDeliberatelyNotExposed', () => {
  it('parses arbitrary note content, not a hardcoded list', () => {
    const fakeNote = [
      '## drugsfda — fake heading',
      '',
      '**Deliberately not exposed** (cleared 5%, rejected anyway):',
      '',
      '- **`totally.fake.path` (1.0) — seeded, dropped.**',
      '- `another.fake.path` (2.0) — some other reason.',
      '',
      "**Deviations from the plan's seeded list:** should stop here, so `should.not.appear` is excluded.",
      '',
      '---',
      '',
      '## orangebook — a later section',
      '',
      '- `should.not.be.included.either`',
      '',
    ].join('\n');

    const result = parseDeliberatelyNotExposed(fakeNote);

    expect(result.has('totally.fake.path')).toBe(true);
    expect(result.has('another.fake.path')).toBe(true);
    expect(result.has('should.not.appear')).toBe(false);
    expect(result.has('should.not.be.included.either')).toBe(false);
  });
});

describe('drug-drugsfda exposes exactly the live-probed 1.x paths', () => {
  /**
   * Task 3's field selection dropped 7 of the 25 paths 1.x advertises
   * (duplicates, per-application ordinals, and opaque per-document values —
   * see the field-selection note). That is a deliberate reduction, not a
   * regression, so this test is amended from a strict "every path is
   * reachable" assertion to: every 1.x (section, field) pair must be either
   * exposed as a field on drug-drugsfda, OR named in the note's
   * "Deliberately not exposed" list for this endpoint. A pair that is
   * neither is an undocumented, silent drop — exactly the failure mode this
   * guard exists to catch.
   */
  it('every 1.x path is exposed as a field, or listed as deliberately dropped', () => {
    const noteText = readFileSync(NOTE_PATH, 'utf8');
    const droppedPaths = parseDeliberatelyNotExposed(noteText);
    const exposed = new Set(drugDrugsfda.fields.map((f) => f.name));

    let checkedCount = 0;
    let exposedCount = 0;
    let droppedCount = 0;

    for (const [section, definition] of Object.entries(SECTIONS)) {
      for (const field of Object.keys(definition.fields)) {
        const resolved = resolveField(section, field);
        expect(resolved.ok).toBe(true);
        if (!resolved.ok) continue;

        checkedCount += 1;
        const isExposed = exposed.has(resolved.path);
        const isDropped = droppedPaths.has(resolved.path);
        if (isExposed) exposedCount += 1;
        if (isDropped) droppedCount += 1;

        expect(
          isExposed || isDropped,
          `${section}.${field} -> "${resolved.path}" is neither exposed as a ` +
            'drug-drugsfda field nor listed as deliberately dropped in the ' +
            'field-selection note — this is an undocumented, silent drop.'
        ).toBe(true);
      }
    }

    // Non-vacuity: the 1.x table has 25 paths; prove both branches of the
    // disjunction above actually fired rather than one of them going unused
    // (which would mean this test could pass even if that branch were dead).
    expect(checkedCount).toBe(25);
    expect(exposedCount).toBe(18);
    expect(droppedCount).toBe(7);
  });

  it('the field-selection note names exactly the 7 dropped 1.x paths', () => {
    const noteText = readFileSync(NOTE_PATH, 'utf8');
    const droppedPaths = parseDeliberatelyNotExposed(noteText);

    for (const path of [
      'openfda.application_number',
      'products.product_number',
      'submissions.submission_number',
      'submissions.application_docs.id',
      'submissions.application_docs.url',
      'submissions.application_docs.date',
      'submissions.application_docs.type',
    ]) {
      expect(droppedPaths.has(path), `expected "${path}" in the dropped-paths list`).toBe(true);
    }

    // A kept path must NOT show up as "dropped" — otherwise this test could
    // pass by simply matching everything.
    expect(droppedPaths.has('application_number')).toBe(false);
    expect(droppedPaths.has('sponsor_name')).toBe(false);
  });

  it('issues the same query as get-drugsfda for the same sponsor', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'sponsor_name',
      searchValue: 'Pfizer',
      limit: 5,
    });
    const oldSearch = new URL(oldStub.calls[0]!).searchParams.get('search');
    oldStub.restore();

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer', limit: 5 });
    expect(new URL(newStub.calls[0]!).searchParams.get('search')).toBe(oldSearch);
  });

  it('returns the same summary record shape as 1.3.0', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'sponsor_name',
      searchValue: 'Pfizer',
      limit: 5,
    });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    ).results[0];

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(
      await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer', limit: 5 })
    ).results[0];

    expect(newRecord).toEqual(oldRecord);
  });
});
