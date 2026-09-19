# openFDA MCP 1.3.0 (round 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decode aggregated FAERS codes, bound `get-drugsfda` output size, add paging to `get-drug-by-name`, stop emitting `"Unknown"` as a generic name, and align two field-shape inconsistencies.

**Architecture:** `faers.ts` becomes the single source of truth for every FAERS code map, consumed by BOTH adverse-event tools so they can no longer disagree. `get-drugsfda` gains a `detail` mode and normalises its product records. Two tools gain paging parameters matching their siblings.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Zod, Vitest, Vite, `@modelcontextprotocol/sdk`.

**Spec:** `docs/superpowers/specs/2026-09-19-openfda-round3-design.md`

## Global Constraints

- Fix in `src/`, never `dist/`.
- **Do not invent openFDA field names or FAERS code meanings.** Every code map
  in this release comes verbatim from `https://open.fda.gov/fields/drugevent.yaml`.
- Query operators are space-separated (` AND `, ` OR `). A literal `+` encodes
  to `%2B` and silently returns NOT_FOUND.
- Never interpolate a built URL into user-facing `text:` output.
  `tests/no-url-in-output.test.ts` enforces this; its scan covers `src/drug/`.
- Never log or echo the API key. **Do not print environment variables** — two
  implementers leaked the key into transcripts in the previous release.
- `src/` modules import with the `.js` extension; test files import
  `../src/...` and `./helpers/...` WITHOUT one.
- New `src/` files start with:
  `/*\n * Copyright (c) 2025 Ythalo Saldanha\n * Licensed under the MIT License\n */`
- Tests are offline: stub `fetch`, use fixtures, never hit the network. The
  manual scripts (`capture-fixtures.mjs`, `smoke-local.mjs`,
  `probe-drugsfda-paths.mjs`, and the new `probe-faers-codes.mjs`) may.
- **The description-drift guard** (`tests/description-drift.test.ts`) asserts
  every tool's `returnsFields` are named in its description AND emitted by its
  handler. Any task that changes a tool's output must keep both halves true.
  Never declare a field the handler emits conditionally.
- `tsconfig.json` has `"strict": true`.
- Verification: `npm run test:ci`, `npm run typecheck`, `npm run lint`, `npm run build:cli`.
- Target version `1.3.0`.

## A note on line numbers

Line references point at the **pre-change** state and drift as earlier tasks
land. Locate code by the quoted content, not the number.

## Verified reference data

Measured against the live API; tests assert against these.

| Fact | Value |
|---|---|
| `serious` count term | `1` — **`typeof number`**, not string |
| `reactionmeddrapt.exact` count term | `"DRUG INEFFECTIVE"` — string, needs no decoding |
| Neurontin `get-drugsfda` at `limit: 5` | 71,393 chars; only **3** applications match |
| One Neurontin application | 21,042 chars, 38 submissions (~550 chars each) |
| `openfda.brand_name:"Advil"` | 39 total; `[0]` combination, `[1]` JUNIOR STRENGTH ADVIL |
| insulin glargine routes | `openfda.route: ["SUBCUTANEOUS"]` vs `products[].route: ["INJECTION","INJECTION"]` |
| insulin glargine `te_code` | absent from every product record |
| Rayos / Cordarone | resolve via `spl_product_data_elements`; `openfda` object is `{}` |

**Authoritative FAERS values** (from `open.fda.gov/fields/drugevent.yaml`):

- `patient.patientsex`: `0` Unknown, `1` Male, `2` Female
- `serious`: `1` "The adverse event resulted in death, a life threatening condition, hospitalization, disability, congenital anomaly, or other serious condition", `2` "The adverse event did not result in any of the above"
- `patient.reaction.reactionoutcome`: `1`–`6`, already in `REACTION_OUTCOMES`

## File Structure

**Create:**
- `scripts/probe-faers-codes.mjs` — manual validator against the live YAML
- `tests/faers-codes.test.ts`, `tests/drugsfda-detail.test.ts`,
  `tests/by-name-paging.test.ts`

**Modify:**
- `src/drug/faers.ts` — add `SERIOUSNESS`, `PATIENT_SEX`, `describeCountTerm`
- `src/drug/get-drug-adverse-event-counts.ts` — decode terms, fix the `term` type
- `src/drug/get-drug-adverse-events.ts` — use the shared seriousness map
- `src/drug/get-drugsfda.ts` — `detail` mode, product normalisation, route docs
- `src/drug/get-drug-by-name.ts` — `limit`/`skip`, `substance_name` first
- `src/drug/resolve-label.ts` — `resolveGenericName` returns `string | null`
- `src/drug/label-fields.ts` — `ask_doctor_or_pharmacist` in `SafetyFields`
- `src/drug/get-drug-safety-info.ts` — declare/describe the new field
- `package.json`, `README.md`, `CLAUDE.md`, `scripts/smoke-local.mjs`

---

### Task 1: One source of truth for FAERS codes (R1, part 1)

**Files:**
- Modify: `src/drug/faers.ts`
- Create: `tests/faers-codes.test.ts`
- Create: `scripts/probe-faers-codes.mjs`
- Modify: `package.json` (add the probe script)

**Interfaces:**
- Consumes: nothing.
- Produces, from `src/drug/faers.ts`:
  - `SERIOUSNESS: Record<string, string>`
  - `PATIENT_SEX: Record<string, string>`
  - `CODED_COUNT_FIELDS: Record<string, Record<string, string>>`
  - `describeCountTerm(field: string, term: unknown): string`
  - existing `REACTION_OUTCOMES` and `describeOutcome` are unchanged.

**Why one map:** the defect is that two tools decode the same fields
differently. A second decoder in the counts tool would leave two sources of
truth. Both tools will consume these maps (Task 2).

- [ ] **Step 1: Write the failing test**

Create `tests/faers-codes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  SERIOUSNESS,
  PATIENT_SEX,
  CODED_COUNT_FIELDS,
  describeCountTerm,
} from '../src/drug/faers';

describe('FAERS code maps', () => {
  it('matches the documented seriousness values', () => {
    expect(Object.keys(SERIOUSNESS).sort()).toEqual(['1', '2']);
    expect(SERIOUSNESS['1']).toBe('Serious');
    expect(SERIOUSNESS['2']).toBe('Not serious');
  });

  it('matches the documented patient sex values', () => {
    expect(Object.keys(PATIENT_SEX).sort()).toEqual(['0', '1', '2']);
    expect(PATIENT_SEX['0']).toBe('Unknown');
    expect(PATIENT_SEX['1']).toBe('Male');
    expect(PATIENT_SEX['2']).toBe('Female');
  });

  it('registers exactly the coded count fields', () => {
    expect(Object.keys(CODED_COUNT_FIELDS).sort()).toEqual([
      'patient.patientsex',
      'patient.reaction.reactionoutcome',
      'serious',
    ]);
  });
});

describe('describeCountTerm', () => {
  it('decodes a numeric code, which is what openFDA actually sends', () => {
    // Measured: count terms for coded fields arrive as NUMBERS, not strings.
    expect(describeCountTerm('serious', 1)).toBe('Serious');
    expect(describeCountTerm('patient.patientsex', 2)).toBe('Female');
    expect(describeCountTerm('patient.reaction.reactionoutcome', 5)).toBe(
      'Fatal'
    );
  });

  it('decodes a string code too', () => {
    expect(describeCountTerm('serious', '2')).toBe('Not serious');
  });

  it('passes text fields through untouched', () => {
    expect(
      describeCountTerm(
        'patient.reaction.reactionmeddrapt.exact',
        'DRUG INEFFECTIVE'
      )
    ).toBe('DRUG INEFFECTIVE');
    expect(describeCountTerm('occurcountry.exact', 'US')).toBe('US');
  });

  it('does not invent a label for an unrecognised code', () => {
    expect(describeCountTerm('serious', 9)).toBe(
      'Unrecognized serious code "9"'
    );
  });

  it('reports an absent term honestly', () => {
    expect(describeCountTerm('serious', undefined)).toBe('Not reported');
    expect(describeCountTerm('serious', null)).toBe('Not reported');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/faers-codes.test.ts`
Expected: FAIL — `SERIOUSNESS` is not exported.

- [ ] **Step 3: Implement**

Append to `src/drug/faers.ts`:

```ts
/**
 * FAERS `serious` enumeration, from openFDA's published field reference
 * (https://open.fda.gov/fields/drugevent.yaml). The documented text is a full
 * sentence ("The adverse event resulted in death, a life threatening
 * condition, ..."); these are the short category labels for it, which is what
 * a ranked count needs.
 */
export const SERIOUSNESS: Record<string, string> = {
  '1': 'Serious',
  '2': 'Not serious',
};

/** FAERS `patient.patientsex` enumeration, from the same reference. */
export const PATIENT_SEX: Record<string, string> = {
  '0': 'Unknown',
  '1': 'Male',
  '2': 'Female',
};

/**
 * Which aggregatable fields carry coded integers rather than text. Anything
 * absent from this map is passed through unchanged — `reactionmeddrapt.exact`
 * and `occurcountry.exact` are already human-readable upstream.
 */
export const CODED_COUNT_FIELDS: Record<string, Record<string, string>> = {
  serious: SERIOUSNESS,
  'patient.patientsex': PATIENT_SEX,
  'patient.reaction.reactionoutcome': REACTION_OUTCOMES,
};

/**
 * Decode one aggregated term. openFDA sends coded terms as NUMBERS (measured),
 * so the code is stringified before lookup.
 */
export function describeCountTerm(field: string, term: unknown): string {
  const map = CODED_COUNT_FIELDS[field];
  if (!map) return String(term);
  if (term === undefined || term === null || term === '') return 'Not reported';
  const key = String(term);
  return map[key] ?? `Unrecognized ${field} code "${key}"`;
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/faers-codes.test.ts`

- [ ] **Step 5: Add the manual probe against the live reference**

Create `scripts/probe-faers-codes.mjs`:

```js
// Manual. Re-validates every FAERS code map against openFDA's published field
// reference. The probe pattern is what caught six fabricated query paths in
// the previous release.
// Run: node scripts/probe-faers-codes.mjs
import { readFileSync } from 'node:fs';

const YAML = 'https://open.fda.gov/fields/drugevent.yaml';
const source = readFileSync('src/drug/faers.ts', 'utf8');

// Pull each map's literal entries out of the TypeScript source.
const readMap = (name) => {
  const start = source.indexOf(`export const ${name}: Record<string, string> = {`);
  if (start < 0) throw new Error(`map ${name} not found in faers.ts`);
  const body = source.slice(start, source.indexOf('};', start));
  return Object.fromEntries(
    [...body.matchAll(/'(\d+)':\s*'([^']*)'/g)].map((m) => [m[1], m[2]])
  );
};

const text = await (await fetch(YAML)).text();

// Extract the possible_values block that follows a field name in the YAML.
const documented = (fieldKey) => {
  const i = text.indexOf(`${fieldKey}:`);
  if (i < 0) return null;
  const chunk = text.slice(i, i + 1200);
  const pv = chunk.indexOf('possible_values');
  if (pv < 0) return null;
  return Object.fromEntries(
    [...chunk.slice(pv, pv + 900).matchAll(/'(\d+)':\s*"([^"]*)"/g)].map((m) => [
      m[1],
      m[2],
    ])
  );
};

const CHECKS = [
  ['SERIOUSNESS', 'serious'],
  ['PATIENT_SEX', 'patientsex'],
  ['REACTION_OUTCOMES', 'reactionoutcome'],
];

let bad = 0;
for (const [mapName, fieldKey] of CHECKS) {
  const ours = readMap(mapName);
  const theirs = documented(fieldKey);
  if (!theirs) {
    console.log(`  BAD  ${mapName}: could not read possible_values for ${fieldKey}`);
    bad += 1;
    continue;
  }
  const ourCodes = Object.keys(ours).sort().join(',');
  const theirCodes = Object.keys(theirs).sort().join(',');
  const ok = ourCodes === theirCodes;
  if (!ok) bad += 1;
  console.log(`  ${ok ? 'ok  ' : 'BAD '} ${mapName.padEnd(18)} codes ours=[${ourCodes}] documented=[${theirCodes}]`);
  for (const [code, label] of Object.entries(ours)) {
    console.log(`         ${code} -> "${label}"   documented: "${(theirs[code] ?? '(absent)').slice(0, 70)}"`);
  }
}

console.log(`\n${CHECKS.length} maps probed, ${bad} mismatched`);
process.exit(bad === 0 ? 0 : 1);
```

Add to `package.json` scripts:

```json
    "probe:faers-codes": "node scripts/probe-faers-codes.mjs",
```

- [ ] **Step 6: Run the probe**

Run: `npm run probe:faers-codes`
Expected: every map `ok`, final line `3 maps probed, 0 mismatched`, exit 0.

The probe compares the **set of codes**, not the label text — our labels are
deliberately short categories while the documented `serious` text is a full
sentence. If a code set mismatches, fix the map, not the probe.

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/faers.ts tests/faers-codes.test.ts \
  scripts/probe-faers-codes.mjs package.json
git commit -m "feat: add FAERS seriousness and patient-sex code maps

One source of truth for every FAERS enumeration, so the two adverse-event
tools cannot decode the same field differently. Values come verbatim from
openFDA's published field reference, and probe:faers-codes re-validates
the code sets against it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Both adverse-event tools decode identically (R1, part 2)

**Files:**
- Modify: `src/drug/get-drug-adverse-event-counts.ts`
- Modify: `src/drug/get-drug-adverse-events.ts`
- Test: `tests/adverse-event-counts.test.ts`, `tests/faers.test.ts`

**Interfaces:**
- Consumes: `describeCountTerm`, `SERIOUSNESS` from `src/drug/faers.js` (Task 1).
- Produces: counts results become `{ term, term_code, count }`.

**The defect:** `get-drug-adverse-events` returns `"Yes"`/`"No"` for
seriousness; `get-drug-adverse-event-counts` returns bare `1`/`2`. Same server,
same field, different treatment.

**Deliberate output change:** the per-record tool's `serious` becomes
`"Serious"`/`"Not serious"`, from the shared map. Leaving it as `"Yes"`/`"No"`
would preserve the very inconsistency this task fixes.

- [ ] **Step 1: Write the failing tests**

Append to `tests/adverse-event-counts.test.ts`:

```ts
  it('decodes coded terms and keeps the raw code alongside', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: {},
        // openFDA sends these as numbers, not strings.
        results: [
          { term: 1, count: 370930 },
          { term: 2, count: 135235 },
        ],
      },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'serious',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({
      term: 'Serious',
      term_code: 1,
      count: 370930,
    });
    expect(payload.results[1].term).toBe('Not serious');
  });

  it('decodes patient sex', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      { meta: {}, results: [{ term: 2, count: 284037 }, { term: 0, count: 2150 }] },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'patient.patientsex',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0].term).toBe('Female');
    expect(payload.results[1].term).toBe('Unknown');
  });

  it('leaves text fields untouched', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      { meta: {}, results: [{ term: 'DRUG INEFFECTIVE', count: 9480 }] },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'patient.reaction.reactionmeddrapt.exact',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({
      term: 'DRUG INEFFECTIVE',
      term_code: 'DRUG INEFFECTIVE',
      count: 9480,
    });
  });
```

Append to `tests/faers.test.ts`, inside the existing handler describe block:

```ts
  it('reports seriousness with the same labels the counts tool uses', async () => {
    const result = await getDrugAdverseEvents.handler({
      drugName: 'x',
      limit: 1,
      seriousness: 'all',
    });
    const text = result.content[0].text;

    // Both tools now read from faers.ts SERIOUSNESS, so a reader comparing
    // the two sees the same vocabulary.
    expect(text).toContain('"serious": "Serious"');
    expect(text).not.toContain('"serious": "Yes"');
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/adverse-event-counts.test.ts tests/faers.test.ts`
Expected: FAIL — terms are raw, and `serious` is still `"Yes"`.

- [ ] **Step 3: Decode in the counts tool**

In `src/drug/get-drug-adverse-event-counts.ts`, add to the imports:

```ts
import { describeCountTerm } from './faers.js';
```

Change the result interface — openFDA sends numbers for coded fields, so the
existing `term: string` is wrong:

```ts
interface CountTerm {
  term: string | number;
  count: number;
}
```

Replace the payload's `results: data.results,` with a decoded mapping:

```ts
      // Decode coded enums; text fields pass through. term_code keeps the raw
      // value so callers aggregating by code are unaffected.
      results: data.results.map((row) => ({
        term: describeCountTerm(countField, row.term),
        term_code: row.term,
        count: row.count,
      })),
```

- [ ] **Step 4: Use the shared map in the per-record tool**

In `src/drug/get-drug-adverse-events.ts`, add to the imports:

```ts
import { describeOutcome, SERIOUSNESS } from './faers.js';
```

(keep the existing `describeOutcome` import — merge them into one statement).

Replace:

```ts
        serious: event.serious === '1' ? 'Yes' : 'No',
```

with:

```ts
        // Same map the counts tool uses, so the two tools cannot disagree.
        serious: SERIOUSNESS[String(event.serious)] ?? 'Not reported',
```

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run tests/adverse-event-counts.test.ts tests/faers.test.ts`

- [ ] **Step 6: Check the description still matches**

The counts tool's description says it returns `{term, count}` pairs. It now
returns `{term, term_code, count}`. Update the description to say so, and check
`tests/description-drift.test.ts` still passes — `returnsFields` for this tool
declares envelope keys, not row keys, so it should be unaffected. Confirm
rather than assume.

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/get-drug-adverse-event-counts.ts \
  src/drug/get-drug-adverse-events.ts \
  tests/adverse-event-counts.test.ts tests/faers.test.ts
git commit -m "fix: decode aggregated FAERS codes in both adverse-event tools

The counts tool returned bare integers (serious=1, patientsex=2) with no
legend, while the per-record tool decoded the same fields — same server,
same data, different treatment depending on which tool you called.

Both now read from one map in faers.ts. Counts return term, term_code and
count, so callers aggregating by code are unaffected. The per-record
tool's serious value becomes Serious/Not serious, matching.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Bound `get-drugsfda` output and normalise products (R2, R6a)

**Files:**
- Modify: `src/drug/get-drugsfda.ts`
- Create: `tests/drugsfda-detail.test.ts`

**Interfaces:**
- Consumes: `summarizeResults`, `withTotals` from `src/utils/format.js`.
- Produces: `MAX_SUBMISSIONS_PER_RECORD = 10` exported from
  `src/drug/get-drugsfda.ts`.

**The defect:** Neurontin at the default `limit: 5` returns **71,393
characters**. Only 3 applications match, so `limit` is irrelevant — one
application with 38 submissions is 21,042 characters on its own.

**Also fixed here (R6):** `te_code` is absent from product records on
biologics, while every other field in this API is present-but-empty. Because
this task already reshapes output, normalising products costs one code path
instead of two.

- [ ] **Step 1: Write the failing test**

Create `tests/drugsfda-detail.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsfda, MAX_SUBMISSIONS_PER_RECORD } from '../src/drug/get-drugsfda';
import { stubFetch } from './helpers/stubFetch';

const bigRecord = {
  application_number: 'NDA020235',
  sponsor_name: 'PARKE DAVIS',
  openfda: { brand_name: ['NEURONTIN'], route: ['ORAL'] },
  products: [
    { product_number: '001', dosage_form: 'CAPSULE', route: 'ORAL', te_code: 'AB' },
    { product_number: '002', dosage_form: 'TABLET', route: 'ORAL' }, // no te_code
  ],
  submissions: Array.from({ length: 38 }, (_, i) => ({
    submission_number: String(i + 1),
    submission_status: 'AP',
    application_docs: [{ id: String(i), url: 'http://example/' + i, type: 'Label' }],
  })),
};

describe('get-drugsfda output size', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      { meta: { results: { skip: 0, limit: 5, total: 3 } }, results: [bigRecord] },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('defaults to summary: no submissions array, but a submission count', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const rec = payload.results[0];

    expect(rec.submissions).toBeUndefined();
    expect(rec.submission_count).toBe(38);
    expect(rec.application_number).toBe('NDA020235');
    expect(rec.sponsor_name).toBe('PARKE DAVIS');
    expect(Array.isArray(rec.products)).toBe(true);
  });

  it('keeps the summary response far below the size that broke the budget', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });

    // The real Neurontin response was 71,393 characters at this same limit.
    expect(result.content[0].text.length).toBeLessThan(5000);
  });

  it('caps submissions in full mode and says how many were omitted', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
      detail: 'full',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const rec = payload.results[0];

    expect(rec.submissions).toHaveLength(MAX_SUBMISSIONS_PER_RECORD);
    expect(rec.submission_count).toBe(38);
    expect(rec.submissions_truncated).toBe(true);
  });

  it('emits te_code on every product record, null when absent', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const product of payload.results[0].products) {
      expect(Object.prototype.hasOwnProperty.call(product, 'te_code')).toBe(true);
    }
    expect(payload.results[0].products[0].te_code).toBe('AB');
    expect(payload.results[0].products[1].te_code).toBeNull();
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/drugsfda-detail.test.ts`
Expected: FAIL — `detail` is not accepted; `MAX_SUBMISSIONS_PER_RECORD` is not exported.

- [ ] **Step 3: Implement**

In `src/drug/get-drugsfda.ts`, export the cap near the top:

```ts
/**
 * A single Neurontin application with 38 submissions measures 21,042
 * characters — roughly 550 per submission. Ten keeps a record near 5.5k, so
 * even `limit: 5` in full mode stays far inside the output budget that the
 * uncapped 71,393-character response blew.
 */
export const MAX_SUBMISSIONS_PER_RECORD = 10;
```

Add `detail` to the Zod object, after `limit`:

```ts
    detail: z
      .enum(['summary', 'full'])
      .optional()
      .default('summary')
      .describe(
        'summary (default) returns application number, sponsor, products and a submission count. full adds the submissions array, capped per record.'
      ),
```

Extend the handler signature to accept `detail?: 'summary' | 'full'`.

Add the record shaper above the return:

```ts
/** openFDA omits te_code entirely on some products; emit it either way. */
const normaliseProduct = (product: Record<string, unknown>) => ({
  ...product,
  te_code: product.te_code ?? null,
});

const shapeRecord = (
  record: Record<string, any>,
  detail: 'summary' | 'full'
) => {
  const submissions = Array.isArray(record.submissions) ? record.submissions : [];
  const products = Array.isArray(record.products) ? record.products : [];

  const base = {
    application_number: record.application_number,
    sponsor_name: record.sponsor_name,
    openfda: record.openfda,
    products: products.map(normaliseProduct),
    submission_count: submissions.length,
  };

  if (detail === 'summary') return base;

  return {
    ...base,
    submissions: submissions.slice(0, MAX_SUBMISSIONS_PER_RECORD),
    submissions_truncated: submissions.length > MAX_SUBMISSIONS_PER_RECORD,
  };
};
```

In the handler, declare the mode and shape the results:

```ts
    const mode = detail ?? 'summary';
    const shaped = data.results.map((r) =>
      shapeRecord(r as unknown as Record<string, any>, mode)
    );
```

and use `shaped` in place of `data.results` in the `withTotals(...)` call.

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/drugsfda-detail.test.ts`

- [ ] **Step 5: Update the tool description**

State that `summary` is the default and what each mode returns, and document
the route distinction (R4) while you are in this description:

```
Note: openfda.route is the SPL route of administration and products[].route is the Drugs@FDA product route. They use different controlled vocabularies — the same product can be SUBCUTANEOUS in one and INJECTION in the other — so joining on route across tools will silently miss.
```

- [ ] **Step 6: Check the drift guard**

`get-drugsfda` declares envelope keys in `returnsFields`. You changed record
shape, not envelope shape, so it should still pass. Run
`npx vitest run tests/description-drift.test.ts` and confirm.

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/get-drugsfda.ts tests/drugsfda-detail.test.ts
git commit -m "fix: bound get-drugsfda output with a summary mode

Neurontin at the default limit returned 71,393 characters and spilled to a
file. limit caps applications, not bytes — only 3 applications matched, and
one of them was 21,042 characters with 38 submissions.

summary is now the default; detail: full adds submissions capped at 10 per
record with submission_count and submissions_truncated so the omission is
visible. Product records also now always carry te_code, null when absent,
matching the present-but-empty invariant.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Paging for `get-drug-by-name` (R3)

**Files:**
- Modify: `src/drug/get-drug-by-name.ts`
- Modify: `src/drug/resolve-label.ts` (thread `skip`)
- Create: `tests/by-name-paging.test.ts`

**Interfaces:**
- Consumes: `resolveLabel(term, limit?)` from `src/drug/resolve-label.js`.
- Produces: `resolveLabel(term, limit?, skip?)` — a third optional parameter.

**The defect:** "Advil" reports `Showing 1 of 39` and returns **Advil Dual
Action with Acetaminophen**, a combination product whose warnings carry
acetaminophen liver-damage language irrelevant to ibuprofen. The total tells
the caller 38 other labels exist while giving no way to reach them. Index `[1]`
is JUNIOR STRENGTH ADVIL, single-ingredient.

**No ranking heuristic.** Preferring single-ingredient products would reorder
unhelpfully for drugs that genuinely are combinations, and
`openfda.is_original_packager` is not populated on every label. Paging plus a
prominent `substance_name` lets the caller see and choose.

- [ ] **Step 1: Write the failing test**

Create `tests/by-name-paging.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { stubFetch } from './helpers/stubFetch';

const label = (brand: string, substances: string[]) => ({
  openfda: { brand_name: [brand], substance_name: substances },
});

describe('get-drug-by-name paging', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('passes skip through to the request', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 1, limit: 1, total: 39 } },
        results: [label('JUNIOR STRENGTH ADVIL', ['IBUPROFEN'])],
      },
    ]);

    await getDrugByName.handler({ drugName: 'Advil', skip: 1 });

    expect(fetchStub.calls[0]).toContain('skip=1');
  });

  it('omits skip when not supplied', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 39 } },
        results: [label('ADVIL', ['IBUPROFEN'])],
      },
    ]);

    await getDrugByName.handler({ drugName: 'Advil' });

    expect(fetchStub.calls[0]).not.toContain('skip=');
  });

  it('returns more than one label when limit allows', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 3, total: 39 } },
        results: [
          label('ADVIL DUAL ACTION', ['IBUPROFEN', 'ACETAMINOPHEN']),
          label('JUNIOR STRENGTH ADVIL', ['IBUPROFEN']),
        ],
      },
    ]);

    const result = await getDrugByName.handler({ drugName: 'Advil', limit: 3 });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results).toHaveLength(2);
    expect(payload.total).toBe(39);
  });

  it('puts substance_name first so a combination product is obvious', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 39 } },
        results: [label('ADVIL DUAL ACTION', ['IBUPROFEN', 'ACETAMINOPHEN'])],
      },
    ]);

    const result = await getDrugByName.handler({ drugName: 'Advil' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const keys = Object.keys(payload.results[0]);

    expect(keys[0]).toBe('substance_name');
    expect(payload.results[0].substance_name).toEqual([
      'IBUPROFEN',
      'ACETAMINOPHEN',
    ]);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/by-name-paging.test.ts`
Expected: FAIL — the handler rejects `skip` and `limit`.

- [ ] **Step 3: Thread `skip` through the resolver**

In `src/drug/resolve-label.ts`, change the signature:

```ts
export async function resolveLabel(
  term: string,
  limit = 1,
  skip?: number
): Promise<ResolveResult> {
```

and inside the tier loop, apply it to the builder:

```ts
    const builder = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`${field}:"${term}"`)
      .limit(limit);

    if (skip !== undefined) builder.skip(skip);

    const url = builder.build();
```

(replacing the existing chained `.build()` call).

- [ ] **Step 4: Add the parameters to the tool**

In `src/drug/get-drug-by-name.ts`, extend the Zod object:

```ts
  inputSchema: z.object({
    drugName: z.string().describe('Drug name (brand, generic or substance)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .default(1)
      .describe('Maximum number of labels to return'),
    skip: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        'Offset into the matching labels. The first label is not necessarily the most canonical one — for a brand with many labels, skip reaches the others.'
      ),
  }),
```

Extend the handler signature to `{ drugName, limit, skip }` with
`limit?: number; skip?: number`, pass them to `resolveLabel(drugName, limit ?? 1, skip)`,
and map every returned record rather than only the first:

```ts
    const drugInfo = resolved.data.results.map((drug) => ({
      // substance_name first: a combination product must be obvious at a
      // glance, because the top match for a brand is often a combination.
      substance_name: drug?.openfda.substance_name,
      brand_name: drug?.openfda.brand_name,
      generic_name: drug?.openfda.generic_name,
      manufacturer_name: drug?.openfda.manufacturer_name,
      product_ndc: drug?.openfda.product_ndc,
      product_type: drug?.openfda.product_type,
      route: drug?.openfda.route,
      matched_via: resolved.matched_via,
      ...mapLabelFields(drug as unknown as Record<string, unknown>),
    }));
```

and update the return to use the array and the real limit:

```ts
          text: `${summarizeResults(drugInfo.length, resolved.data.meta?.results?.total, `labels matching "${drugName}"`)}\n\n${JSON.stringify(withTotals(drugInfo, resolved.data.meta?.results?.total, limit ?? 1), null, 2)}`,
```

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run tests/by-name-paging.test.ts`

- [ ] **Step 6: Check existing tests that read this payload**

`tests/get-drug-by-name.test.ts` and `tests/description-drift.test.ts` both
read `payload.results[0]`. That path is unchanged, but the number of records
can now exceed one. Run both and fix any assertion that assumed exactly one
record:

Run: `npx vitest run tests/get-drug-by-name.test.ts tests/description-drift.test.ts`

- [ ] **Step 7: Update the description**

Say the tool accepts `limit` and `skip`, that the first label is not
necessarily the canonical one, and that `substance_name` reveals combination
products. The drift guard requires every `returnsFields` entry to be named, so
keep all existing field names in the text.

- [ ] **Step 8: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 9: Commit**

```bash
git add src/drug/get-drug-by-name.ts src/drug/resolve-label.ts \
  tests/by-name-paging.test.ts tests/get-drug-by-name.test.ts
git commit -m "feat: add limit and skip to get-drug-by-name

Advil reported 'Showing 1 of 39' and returned Advil Dual Action with
Acetaminophen — a combination product whose warnings carry acetaminophen
liver-damage language irrelevant to ibuprofen — with no way to reach the
other 38.

No ranking heuristic: preferring single-ingredient products would reorder
unhelpfully for genuine combinations. Instead substance_name leads the
payload so a combination is obvious, and skip reaches the rest.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `generic_name` is null, not "Unknown" (R5)

**Files:**
- Modify: `src/drug/resolve-label.ts`
- Test: `tests/resolve-label.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `resolveGenericName(openfda): string | null` — return type changes.

**Why not backfill, and why not parse.** Both were tested and rejected:

- On Rayos and Cordarone the entire `openfda` object is `{}`, so there is
  nothing to backfill from.
- Parsing `spl_product_data_elements` works on those two by luck and produces
  `"metformin hydrochloride metformin povidone magnesium stearate hypromelloses
  white to off-white"` for Glucophage.
- A secondary NDC-directory lookup returns `NOT_FOUND` for both, and for
  `brand_name:"Advil"` returns a **topical analgesic** — the wrong drug.

`"Unknown"` reads like data. `null` does not.

- [ ] **Step 1: Write the failing test**

Replace the existing `'says Unknown honestly when neither field is present'`
test in `tests/resolve-label.test.ts` with:

```ts
  it('returns null, not the string "Unknown", when neither field is present', () => {
    // "Unknown" reads like data — indistinguishable from a drug whose generic
    // name is genuinely recorded as unknown. Labels reached through the
    // spl_product_data_elements tier (Rayos, Cordarone) have an empty openfda
    // object, so there is nothing to backfill and nothing honest to say.
    expect(resolveGenericName({})).toBeNull();
    expect(resolveGenericName({ generic_name: [], substance_name: [] })).toBeNull();
  });

  it('never emits the literal string Unknown', () => {
    expect(resolveGenericName({})).not.toBe('Unknown');
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/resolve-label.test.ts`
Expected: FAIL — receives `'Unknown'`.

- [ ] **Step 3: Implement**

In `src/drug/resolve-label.ts`, change the signature and final fallback:

```ts
export function resolveGenericName(
  openfda: Record<string, unknown>
): string | null {
```

and replace the return with:

```ts
  return first(openfda?.generic_name) ?? first(openfda?.substance_name) ?? null;
```

Update the doc comment: `"Unknown"` reads like data, so `null` is returned when
neither structured field exists. Note that parsing
`spl_product_data_elements` was tested and rejected — it yields excipient text
for Glucophage.

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/resolve-label.test.ts`

- [ ] **Step 5: Check the consumer and the drift guard**

`get-drug-safety-info` calls `resolveGenericName` and declares `generic_name`
in `returnsFields`. The key is still emitted — its value is now `null` — so
`hasOwnProperty` still holds and the guard should pass. Confirm:

Run: `npx vitest run tests/description-drift.test.ts`

Then update that tool's description to say `generic_name` is `null` when the
label carries no structured generic or substance name.

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/drug/resolve-label.ts src/drug/get-drug-safety-info.ts \
  tests/resolve-label.test.ts
git commit -m "fix: return null rather than \"Unknown\" for an absent generic name

Labels reached through the spl_product_data_elements tier have an empty
openfda object, so there is nothing to backfill. "Unknown" reads like data
and is indistinguishable from a real value; null is unambiguous.

Parsing spl_product_data_elements was tested and rejected: it yields
"metformin hydrochloride metformin povidone magnesium stearate
hypromelloses white to off-white" for Glucophage. A secondary NDC lookup
was also rejected — it returns a topical analgesic for brand_name Advil.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Align the sibling tools' OTC field set (R6b)

**Files:**
- Modify: `src/drug/label-fields.ts`
- Modify: `src/drug/get-drug-safety-info.ts`
- Test: `tests/label-fields.test.ts`, `tests/description-drift.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `SafetyFields` gains `ask_doctor_or_pharmacist: string[]`.

**The defect:** the same label, the same OTC Drug Facts section, but
`ask_doctor_or_pharmacist` appears in `get-drug-by-name` and not in
`get-drug-safety-info`.

- [ ] **Step 1: Write the failing test**

Append to `tests/label-fields.test.ts`:

```ts
  it('exposes the same OTC Drug Facts fields as mapLabelFields', () => {
    const otcFields = [
      'do_not_use',
      'ask_doctor',
      'ask_doctor_or_pharmacist',
      'stop_use',
      'pregnancy_or_breast_feeding',
    ];
    const safety = mapSafetyFields({});
    const label = mapLabelFields({});

    for (const field of otcFields) {
      expect(safety, `mapSafetyFields is missing ${field}`).toHaveProperty(field);
      expect(label, `mapLabelFields is missing ${field}`).toHaveProperty(field);
    }
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/label-fields.test.ts`
Expected: FAIL — `mapSafetyFields` has no `ask_doctor_or_pharmacist`.

- [ ] **Step 3: Implement**

In `src/drug/label-fields.ts`, add to the `SafetyFields` interface after
`ask_doctor`:

```ts
  ask_doctor_or_pharmacist: string[];
```

and to the `mapSafetyFields` return after the `ask_doctor` line:

```ts
    ask_doctor_or_pharmacist: asArray(drug.ask_doctor_or_pharmacist),
```

- [ ] **Step 4: Declare and describe it**

In `src/drug/get-drug-safety-info.ts`, add `'ask_doctor_or_pharmacist'` to
`returnsFields`, and add the field name to the description — the drift guard
requires both halves.

- [ ] **Step 5: Document the route vocabulary in the label tools too (R4)**

The spec requires this note in the label tools' descriptions as well as
`get-drugsfda`'s. Both `get-drug-by-name` and `get-drug-safety-info` emit
`route` from `openfda`, so add one sentence to each description:

```
route comes from openfda.route, the SPL route of administration. get-drugsfda's products[].route is the Drugs@FDA product route and uses a different controlled vocabulary — the same product can be SUBCUTANEOUS here and INJECTION there — so joining on route across tools will silently miss.
```

`get-drug-safety-info` does not currently emit `route`; if it does not, add
the note only to `get-drug-by-name` and say so in your report rather than
adding a field. Check before writing.

- [ ] **Step 6: Run and confirm pass**

Run: `npx vitest run tests/label-fields.test.ts tests/description-drift.test.ts`

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/label-fields.ts src/drug/get-drug-safety-info.ts \
  src/drug/get-drug-by-name.ts tests/label-fields.test.ts
git commit -m "fix: expose ask_doctor_or_pharmacist from get-drug-safety-info

Two sibling tools reading the same OTC Drug Facts section exposed
different field sets. A test now asserts both mappers cover the same OTC
fields, so they cannot drift apart again.

Also documents the SPL-vs-Drugs@FDA route vocabulary split in the label
tools' descriptions, matching the note added to get-drugsfda.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Documentation and version bump

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `package.json`, `scripts/smoke-local.mjs`

**Interfaces:**
- Consumes: the behaviour of Tasks 1-6.

- [ ] **Step 1: Document the new parameters and modes**

In the README:
- `get-drugsfda` takes `detail` (`summary` default, `full` for submissions,
  capped at 10 per record).
- `get-drug-by-name` takes `limit` and `skip`.
- `get-drug-adverse-event-counts` returns `term`, `term_code` and `count`,
  with coded fields decoded.
- `generic_name` can be `null` when a label carries no structured generic or
  substance name.

- [ ] **Step 2: Document the route-vocabulary distinction**

Add a short note to the README stating that `openfda.route` (SPL route of
administration) and `products[].route` (Drugs@FDA product route) use different
controlled vocabularies — the same insulin glargine product is `SUBCUTANEOUS`
in one and `INJECTION` in the other — so joining on route across tools will
silently miss.

- [ ] **Step 3: Update CLAUDE.md**

- Test count and file list: run `npm run test:ci` and use the real figures.
- Add `scripts/probe-faers-codes.mjs` (`npm run probe:faers-codes`) beside the
  other manual scripts, noting it hits the live API and is not in CI.
- Add `npm run probe:faers-codes` to the Commands block.
- Update the `faers.ts` Key Modules entry to mention all three code maps and
  `describeCountTerm`.
- Update the Available Tools entries for `get-drugsfda` (detail mode),
  `get-drug-by-name` (limit/skip) and `get-drug-adverse-event-counts`
  (decoded terms).

- [ ] **Step 4: Extend the smoke script**

In `scripts/smoke-local.mjs`, add checks for the round 3 fixes:

```js
  t = await call('get-drug-adverse-event-counts', { drugName: 'prednisone', field: 'serious', limit: 2 });
  show('R1  coded count terms are decoded', t, [
    ['shows a readable label', /Serious|Not serious/.test(t)],
    ['keeps the raw code', /"term_code"/.test(t)],
    ['no bare integer term', !/"term":\s*\d+\s*,/.test(t)],
  ]);

  t = await call('get-drugsfda', { sectionName: 'openfda', fieldName: 'brand_name', searchValue: 'Neurontin' });
  show('R2  Neurontin returns inline at default settings', t, [
    ['under the budget that broke before', t.length < 20000],
    ['reports a submission count', /"submission_count"/.test(t)],
    ['no submissions array in summary', !/"submissions":/.test(t)],
  ]);

  t = await call('get-drug-by-name', { drugName: 'Advil', skip: 1 });
  show('R3  skip reaches a different Advil label', t, [
    ['not the dual-action combination', !/Dual Action/i.test(t)],
    ['substance_name leads the record', /"substance_name"/.test(t)],
  ]);

  t = await call('get-drug-safety-info', { drugName: 'Rayos' });
  show('R5  absent generic name is null, not "Unknown"', t, [
    ['no literal Unknown', !/"generic_name":\s*"Unknown"/.test(t)],
    ['null instead', /"generic_name":\s*null/.test(t)],
  ]);
```

- [ ] **Step 5: Bump the version**

In `package.json`, set `"version": "1.3.0"`.

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint && npm run build:cli`

Then the live checks:

```bash
npm run probe:faers-codes
npm run probe:drugsfda
npm run smoke
```

Expected: faers probe 3/0 mismatched; drugsfda probe 25/0 invalid; smoke no
FAIL lines.

- [ ] **Step 7: Confirm the version guard**

Run: `npx vitest run tests/version.test.ts`
Expected: PASS — `serverInfo` is still sourced from `package.json`, now 1.3.0.

- [ ] **Step 8: Commit**

```bash
git add README.md CLAUDE.md package.json scripts/smoke-local.mjs
git commit -m "docs: document round 3 changes; bump to 1.3.0

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Deferred

Nothing from the spec.

## Operational follow-up

The openFDA API key needs rotating — four exposures across the project's
history. No code change in any release recalls a key already distributed.
