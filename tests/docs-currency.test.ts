import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { ENVELOPE_FIELDS } from '../src/core/registry';

const DOCS = ['README.md', 'CLAUDE.md', 'AGENTS.md'];
const RETIRED = [
  'get-drug-by-name', 'get-drug-by-generic-name', 'get-drug-adverse-events',
  'get-drugs-by-manufacturer', 'get-drug-safety-info', 'get-drug-by-ndc',
  'get-drug-by-product-ndc', 'get-drugsfda', 'get-drug-adverse-event-counts',
];

/**
 * Every place a doc enumerates the response envelope must enumerate ALL of it,
 * in `ENVELOPE_FIELDS` order.
 *
 * 2.0.1 added two keys (`dropped_for_budget`, `next_skip`) and left three
 * separate enumerations behind — one of them in `CLAUDE.md`, which is loaded
 * as project instructions for every agent working here, and which therefore
 * described a pipeline the code had stopped implementing. A partial
 * enumeration is worse than none: it reads as exhaustive, so a consumer
 * concludes a key does not exist. Nothing tied those lists to the code, which
 * is exactly why they drifted, so this guard ties them.
 *
 * An "enumeration" is `ENUMERATION_MIN` or more envelope keys in *list
 * position*: consecutive key mentions with nothing between them but a
 * separator — whitespace, punctuation, "and"/"or", markdown emphasis. One or
 * two keys is prose about those keys ("limit default 5, max 50"), and a key
 * with prose either side of it is not part of a list at all ("results are a
 * deterministic slice"); three in a row separated only by commas is the list,
 * and a reader will take it as exhaustive.
 *
 * Backticks are stripped first so `a, b, c` and `a`, `b`, `c` read alike — the
 * guard is about completeness and order, not markup. Parenthesised text is
 * lifted out and scanned separately, because the docs use parentheses both
 * ways: to gloss one key mid-list ("`total` (the upstream match count),
 * `limit`") and to hold a whole list ("the envelope shape (`matched_via`,
 * `total`, ...)"). Blanking each group in place keeps the first reading a list
 * while scanning the group's own contents catches the second.
 */
const ENUMERATION_MIN = 3;

/**
 * The aggregated (`count`) payload is a different shape on purpose: it carries
 * `counted_by` and no `next_skip`, because an aggregation has no result total
 * and no skip semantics. A list that names `counted_by` is describing that
 * payload, so the record envelope's key list does not apply to it.
 */
const AGGREGATION_MARKER = 'counted_by';

/** What may appear *between* two keys of one list, and nothing else. */
const SEPARATOR = /^(?:[\s,;:.|*_—–-]|\band\b|\bor\b|\bthen\b)*$/;

interface Enumeration {
  keys: string[];
  excerpt: string;
}

function findEnumerations(raw: string): Enumeration[] {
  const pattern = new RegExp(`\\b(${ENVELOPE_FIELDS.join('|')})\\b`, 'g');
  const found: Enumeration[] = [];

  // Blank every parenthesised group in place (innermost first), keeping its
  // contents as a segment of its own. Blanking with spaces rather than
  // deleting leaves the surrounding list readable as one list.
  let outer = raw.replace(/`/g, '').replace(/\s+/g, ' ');
  const inner: string[] = [];
  for (;;) {
    const before = outer;
    outer = outer.replace(/\(([^()]*)\)/g, (whole, body: string) => {
      inner.push(body);
      return ' '.repeat(whole.length);
    });
    if (outer === before) break;
  }

  for (const segment of [outer, ...inner]) {
    const hits = [...segment.matchAll(pattern)].map((match) => ({
      key: match[1]!,
      start: match.index!,
      end: match.index! + match[1]!.length,
    }));

    // Chain adjacent hits into lists, breaking wherever prose intervenes.
    let list: typeof hits = [];
    const close = (): void => {
      const keys = [...new Set(list.map((hit) => hit.key))];
      const excerpt = list.length
        ? segment
            .slice(list[0]!.start, list[list.length - 1]!.end)
            .replace(/\s+/g, ' ')
        : '';
      if (keys.length >= ENUMERATION_MIN && !excerpt.includes(AGGREGATION_MARKER))
        found.push({ keys, excerpt });
      list = [];
    };
    for (const hit of hits) {
      const previous = list[list.length - 1];
      if (previous && !SEPARATOR.test(segment.slice(previous.end, hit.start)))
        close();
      list.push(hit);
    }
    close();
  }

  return found;
}

/**
 * The `drug-shortages` `status` vocabulary, read off the descriptor's own
 * field description rather than restated here. Defect 6 of this release was
 * a two-state description of a three-state field, and the three docs were
 * corrected by hand; a hand-corrected fact with no guard is the next drift.
 */
const shortages = DRUG_ENDPOINTS.find((d) => d.toolName === 'drug-shortages')!;
const statusDescription = shortages.fields.find((f) => f.name === 'status')!
  .description;
const STATUS_VALUES = statusDescription
  .split(/,\s*|\s+or\s+/)
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

describe('documentation matches the shipped tool surface', () => {
  for (const doc of DOCS) {
    const text = readFileSync(doc, 'utf8');

    for (const descriptor of DRUG_ENDPOINTS) {
      it(`${doc} documents ${descriptor.toolName}`, () => {
        expect(text).toContain(descriptor.toolName);
      });
    }

    it(`${doc} does not present a retired tool as current`, () => {
      // README may name retired tools ONLY inside the migration table, which
      // is the one place they belong. Everywhere else is stale documentation.
      const body = doc === 'README.md' ? text.split('<!-- migration-table -->')[0]! : text;
      for (const retired of RETIRED) expect(body).not.toContain(retired);
    });

    it(`${doc} enumerates every envelope key, in order, wherever it enumerates any`, () => {
      const found = findEnumerations(text);
      // A doc that enumerates the envelope nowhere is not documenting the
      // response shape at all, which is its own failure.
      expect(found.length, `${doc} enumerates the envelope nowhere`).toBeGreaterThan(0);
      // Every offender at once, not just the first: this release left three
      // stale enumerations behind, and fixing them one failing run at a time
      // is how the third gets missed.
      const stale = found
        .filter(
          (enumeration) =>
            enumeration.keys.join(',') !== ENVELOPE_FIELDS.join(',')
        )
        .map(
          (enumeration) =>
            `"${enumeration.excerpt}" names [${enumeration.keys.join(', ')}]`
        );
      expect(
        stale,
        `${doc}: enumeration(s) incomplete or out of order; expected exactly [${ENVELOPE_FIELDS.join(', ')}]`
      ).toEqual([]);
    });

    it(`${doc} names every drug-shortages status value`, () => {
      for (const value of STATUS_VALUES) {
        expect(text, `${doc} omits the status value "${value}"`).toContain(value);
      }
    });
  }

  it("drug-shortages' own summary names every status value it declares", () => {
    // The summary is the always-loaded tool description: the highest-visibility
    // text there is. A model that reads "current or resolved" and wants
    // "not resolved" searches status=Current and silently misses every
    // To Be Discontinued record.
    for (const value of STATUS_VALUES) {
      expect(
        shortages.summary,
        `drug-shortages' summary omits the status value "${value}"`
      ).toContain(value);
    }
  });
});
