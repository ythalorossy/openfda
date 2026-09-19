# openFDA MCP 1.2.0 (round 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix six defects and five limitations found verifying published 1.1.0, and add the `sponsor_name` search capability.

**Architecture:** `OpenFDABuilder` gains `count`/`skip`/`sort` so aggregation and paging are expressible at all. A `SECTIONS` lookup table replaces `get-drugsfda`'s prose field list, mapping each section to its *verified* query prefix and fields. A shared `event-search.ts` builds one OR query across three FAERS indexes. Two new shared constants (`NDC_FORMATS`, tool `returnsFields`) close the documentation-drift class.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Zod, Vitest, Vite, `@modelcontextprotocol/sdk`.

**Spec:** `docs/superpowers/specs/2026-09-19-openfda-round2-design.md`

## Global Constraints

- Fix in `src/`, never `dist/`.
- **Do not invent openFDA field names.** Every path in this plan was verified
  with an `_exists_` probe against the live API. Six previously-shipped paths
  turned out to be fabricated; that is the defect this release exists to fix.
- Query operators are space-separated (` AND `, ` OR `). A literal `+` encodes
  to `%2B` and silently returns NOT_FOUND.
- Never interpolate a built URL into user-facing `text:` output.
  `tests/no-url-in-output.test.ts` enforces this and must stay green.
- Never log or echo the API key.
- `src/` modules import with the `.js` extension; test files import
  `../src/...` without one.
- New `src/` files start with:
  `/*\n * Copyright (c) 2025 Ythalo Saldanha\n * Licensed under the MIT License\n */`
- Tests are offline: stub `fetch`, use fixtures, never hit the network. The
  only exceptions are the manual `scripts/capture-fixtures.mjs` and the new
  `scripts/probe-drugsfda-paths.mjs`.
- `tsconfig.json` has `"strict": true` and `"resolveJsonModule": true`.
- Verification: `npm run test:ci`, `npm run typecheck`, `npm run lint`, `npm run build:cli`.
- Target version `1.2.0`.

## A note on line numbers

Line references point at the **pre-change** state and drift as earlier tasks
land. Locate code by the quoted content, not the number.

## Verified reference data

Measured against the live API; tests assert against these figures.

| Fact | Value |
|---|---|
| citalopram, `patient.drug.medicinalproduct` | 113,881 |
| citalopram, `patient.drug.openfda.generic_name` | 136,043 |
| citalopram, OR union of all three fields | **143,346** |
| `products.marketing_status:"Discontinued"` | 14,813 |
| `submissions.application_docs.type:"Label"` | 5,088 |
| `sponsor_name:"UPJOHN"` / `"Upjohn"` / `"upjohn"` | 13 / NOT_FOUND / NOT_FOUND |
| `skip=25000` / `skip=26000` | ok / `BAD_REQUEST: Skip value must 25000 or less` |
| `meta.results.total` on a `count=` response | absent |

Non-existent paths (must never be emitted): `application.application_number`,
`application_docs.applications_doc_id`, `application_docs.applications_doc_date`,
`application_docs.application_docs_title`, `application_docs.applications_doc_type`,
`application_docs.applications_doc_url`.

## File Structure

**Create:**
- `src/drug/event-search.ts` — the OR query across three FAERS indexes
- `src/drug/drugsfda-sections.ts` — `SECTIONS` table + field resolution
- `src/drug/get-drug-adverse-event-counts.ts` — the new aggregation tool
- `src/utils/ndc-formats.ts` — one accepted-format block for both NDC tools
- `scripts/probe-drugsfda-paths.mjs` — manual `_exists_` path validator
- tests for each of the above

**Modify:**
- `src/OpenFDABuilder.ts` — add `count`/`skip`/`sort`
- `src/drug/get-drugsfda.ts` — rebuild around `SECTIONS`, add limit + totals
- `src/drug/get-drug-adverse-events.ts` — OR search, `skip`, `sort`
- `src/drug/get-drug-by-ndc.ts` — shared format block, `matched_via`
- `src/drug/get-drug-by-product-ndc.ts` — shared format block
- `src/drug/get-drug-by-name.ts` — total, description
- `src/drug/get-drug-safety-info.ts` — `generic_name` backfill, description
- `src/drug/get-drugs-by-manufacturer.ts` — `matched_via`
- `src/drug/index.ts`, `src/index.ts` — register the new tool
- `README.md`, `CLAUDE.md`, `package.json`

---

### Task 1: Teach `OpenFDABuilder` count, skip and sort

**Files:**
- Modify: `src/OpenFDABuilder.ts`
- Test: `tests/OpenFDABuilder.test.ts`

**Interfaces:**
- Consumes: `checkApiKey` from `src/utils/env.js` (existing).
- Produces: `OpenFDABuilder.count(field: string): this`,
  `.skip(n: number): this`, `.sort(s: string): this`. Each is optional and
  omitted from the URL when unset.

**Why first:** aggregation (Task 4) and paging (Task 3) cannot be expressed at
all until the builder can emit these parameters.

- [ ] **Step 1: Write the failing tests**

Append to `tests/OpenFDABuilder.test.ts`:

```ts
  it('omits count, skip and sort when they are not set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .build();
    expect(url).not.toContain('count=');
    expect(url).not.toContain('skip=');
    expect(url).not.toContain('sort=');
  });

  it('emits count when set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .count('patient.reaction.reactionmeddrapt.exact')
      .build();
    expect(url).toContain(
      'count=patient.reaction.reactionmeddrapt.exact'
    );
  });

  it('emits skip and sort when set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .skip(20)
      .sort('receivedate:desc')
      .build();
    expect(url).toContain('skip=20');
    expect(url).toContain('sort=receivedate%3Adesc');
  });

  it('still encodes the search query when the new params are present', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('a:"x" OR b:"y"')
      .skip(5)
      .build();
    expect(url).toContain('+OR+');
    expect(url).not.toContain('%2BOR%2B');
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/OpenFDABuilder.test.ts`
Expected: FAIL — `.count is not a function`.

- [ ] **Step 3: Implement**

In `src/OpenFDABuilder.ts`, add after the existing `limit()` method:

```ts
  /** Aggregate by a field instead of returning records. */
  count(field: string): this {
    this.params.set('count', field);
    return this;
  }

  /** Offset into the result set. openFDA rejects values above 25000. */
  skip(n: number): this {
    this.params.set('skip', n);
    return this;
  }

  /** e.g. 'receivedate:desc'. */
  sort(order: string): this {
    this.params.set('sort', order);
    return this;
  }
```

and in `build()`, after the existing `query.set('limit', ...)` line, add:

```ts
    // Optional parameters: emitted only when explicitly set, so an unset
    // value never reaches openFDA as an empty string.
    for (const key of ['count', 'skip', 'sort'] as const) {
      const value = this.params.get(key);
      if (value !== undefined) query.set(key, String(value));
    }
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/OpenFDABuilder.test.ts`

- [ ] **Step 5: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/OpenFDABuilder.ts tests/OpenFDABuilder.test.ts
git commit -m "feat: support count, skip and sort in OpenFDABuilder

Aggregation and paging were unexpressible: build() emitted only api_key,
search and limit. Each new parameter is omitted entirely when unset.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Search all three FAERS indexes (N4)

**Files:**
- Create: `src/drug/event-search.ts`
- Create: `tests/event-search.test.ts`
- Modify: `src/drug/get-drug-adverse-events.ts` (the `searchQuery` line)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `EVENT_SEARCH_FIELDS: readonly string[]`,
  `buildEventSearch(drugName: string): string`,
  `EVENT_MATCHED_VIA: string` — all from `src/drug/event-search.ts`.

**The defect:** the server searched only `patient.drug.medicinalproduct`, the
product name as the reporter typed it. Measured for citalopram: that field has
113,881 reports, `openfda.generic_name` has 136,043, and the OR union of all
three has **143,346**. A tiered fallback would be wrong here — it would match
`medicinalproduct` first and never reach the better index.

- [ ] **Step 1: Write the failing test**

Create `tests/event-search.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  EVENT_SEARCH_FIELDS,
  buildEventSearch,
  EVENT_MATCHED_VIA,
} from '../src/drug/event-search';

describe('buildEventSearch', () => {
  it('searches all three FAERS indexes', () => {
    expect(EVENT_SEARCH_FIELDS).toEqual([
      'patient.drug.openfda.generic_name',
      'patient.drug.openfda.substance_name',
      'patient.drug.medicinalproduct',
    ]);
  });

  it('ORs the fields with spaces, never a literal +', () => {
    const q = buildEventSearch('citalopram');
    expect(q).toBe(
      'patient.drug.openfda.generic_name:"citalopram" OR ' +
        'patient.drug.openfda.substance_name:"citalopram" OR ' +
        'patient.drug.medicinalproduct:"citalopram"'
    );
    expect(q).not.toContain('+OR+');
  });

  it('names the union in matched_via so a caller knows it is not one field', () => {
    expect(EVENT_MATCHED_VIA).toContain('union');
    for (const field of EVENT_SEARCH_FIELDS) {
      expect(EVENT_MATCHED_VIA).toContain(field);
    }
  });

  it('escapes nothing but passes the term through verbatim', () => {
    expect(buildEventSearch('oxycodone')).toContain('"oxycodone"');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/event-search.test.ts`
Expected: FAIL — cannot resolve `../src/drug/event-search`.

- [ ] **Step 3: Implement**

Create `src/drug/event-search.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * FAERS indexes a drug three ways. `medicinalproduct` is the product name as
 * the reporter typed it, so searching it alone misses reports filed under a
 * brand name, a misspelling, or a combination-product string.
 *
 * Measured for citalopram: medicinalproduct 113,881; openfda.generic_name
 * 136,043; the union of all three 143,346. The union beats every single
 * field, which is why this is an OR rather than a tiered fallback — a
 * fallback would match medicinalproduct first and never reach the better
 * index.
 */
export const EVENT_SEARCH_FIELDS = [
  'patient.drug.openfda.generic_name',
  'patient.drug.openfda.substance_name',
  'patient.drug.medicinalproduct',
] as const;

export const EVENT_MATCHED_VIA = `union(${EVENT_SEARCH_FIELDS.join(', ')})`;

/**
 * Operators are space-separated. URLSearchParams encodes a space to `+`,
 * which is the wire form openFDA expects; a literal `+` would encode to
 * `%2B` and silently return NOT_FOUND.
 */
export function buildEventSearch(drugName: string): string {
  return EVENT_SEARCH_FIELDS.map(
    (field) => `${field}:"${drugName}"`
  ).join(' OR ');
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/event-search.test.ts`

- [ ] **Step 5: Wire it into the handler**

In `src/drug/get-drug-adverse-events.ts`, add the import:

```ts
import { buildEventSearch, EVENT_MATCHED_VIA } from './event-search.js';
```

Replace:

```ts
    let searchQuery = `patient.drug.medicinalproduct:"${drugName}"`;
```

with:

```ts
    let searchQuery = buildEventSearch(drugName);
```

The seriousness filter below it already appends ` AND serious:${serious}`.
Because the OR terms are now a disjunction, that AND must bind against the
whole group — wrap the disjunction in parentheses. Change:

```ts
    if (seriousness !== 'all') {
      const serious = seriousness === 'serious' ? '1' : '2';
      searchQuery += ` AND serious:${serious}`;
    }
```

to:

```ts
    if (seriousness !== 'all') {
      const serious = seriousness === 'serious' ? '1' : '2';
      // Parenthesise the OR group: without it, `a OR b OR c AND serious:1`
      // binds the AND to the last term only and the filter silently applies
      // to one index instead of all three.
      searchQuery = `(${searchQuery}) AND serious:${serious}`;
    }
```

Then add `matched_via` to the payload. Change the success return's
`withTotals(events, ...)` call so the payload carries it — replace:

```ts
          text: `${summarizeResults(events.length, eventData.meta?.results?.total, `adverse event reports for "${drugName}"`)}\n\n${JSON.stringify(withTotals(events, eventData.meta?.results?.total, limit ?? 10), null, 2)}`,
```

with:

```ts
          text: `${summarizeResults(events.length, eventData.meta?.results?.total, `adverse event reports for "${drugName}"`)}\n\n${JSON.stringify({ matched_via: EVENT_MATCHED_VIA, ...withTotals(events, eventData.meta?.results?.total, limit ?? 10) }, null, 2)}`,
```

- [ ] **Step 6: Add a handler test proving all three fields are queried**

Append to `tests/adverse-events-query.test.ts`:

```ts
  it('queries all three FAERS indexes, ORed', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });

    const url = fetchStub.calls[0];
    expect(url).toContain('openfda.generic_name');
    expect(url).toContain('openfda.substance_name');
    expect(url).toContain('medicinalproduct');
    expect(url).toContain('+OR+');
    expect(url).not.toContain('%2BOR%2B');
  });

  it('parenthesises the OR group when filtering by seriousness', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'serious',
    });

    const url = decodeURIComponent(fetchStub.calls[0]);
    // The AND must bind to the whole disjunction, not just the last term.
    expect(url).toContain('(patient.drug.openfda.generic_name');
    expect(url).toContain(') AND serious:1');
  });
```

- [ ] **Step 6b: Assert the union total against the recorded figure**

The point of this task is a number, not a query string. Append to
`tests/adverse-events-query.test.ts`:

```ts
  it('reports the union total, not the single-field total', async () => {
    // Recorded from the live API: medicinalproduct alone gives 113,881;
    // the union of all three indexes gives 143,346. A regression that
    // narrowed the search would show up here as a smaller number.
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 143346 } },
        results: [{ safetyreportid: '1', patient: { reaction: [] } }],
      },
    ]);

    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });
    const text = result.content[0].text;

    expect(text).toContain('143346');
    expect(text).not.toContain('113881');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.total).toBe(143346);
    expect(payload.matched_via).toContain('union');
  });
```

Run: `npx vitest run tests/adverse-events-query.test.ts`

- [ ] **Step 7: Run the suite**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/event-search.ts tests/event-search.test.ts \
  src/drug/get-drug-adverse-events.ts tests/adverse-events-query.test.ts
git commit -m "fix: search all three FAERS indexes, not just medicinalproduct

medicinalproduct is the product name as the reporter typed it, so reports
filed under a brand name or misspelling were missed. Measured for
citalopram: 113,881 via that field alone against 143,346 for the union of
all three indexes — a 16% under-report.

An OR rather than a tiered fallback, because a fallback would match
medicinalproduct first and never reach the better index. The seriousness
filter now parenthesises the disjunction so AND binds to the whole group.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Paging and ordering for adverse events (L2)

**Files:**
- Modify: `src/drug/get-drug-adverse-events.ts`
- Test: `tests/adverse-events-query.test.ts`

**Interfaces:**
- Consumes: `OpenFDABuilder.skip()` / `.sort()` (Task 1);
  `buildEventSearch` (Task 2).
- Produces: `SKIP_MAX = 25000` exported from
  `src/drug/get-drug-adverse-events.ts`.

**The defect:** results were a deterministic earliest-`report_id` slice with no
way past the limit, so the first 10 of a limit-20 call are byte-identical to a
limit-10 call and no sample can characterise 143,346 reports.

- [ ] **Step 1: Write the failing tests**

Append to `tests/adverse-events-query.test.ts`:

```ts
  it('passes skip and sort through to the request', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
      skip: 20,
      sort: 'receivedate:desc',
    });

    const url = fetchStub.calls[0];
    expect(url).toContain('skip=20');
    expect(url).toContain('sort=receivedate%3Adesc');
  });

  it('rejects skip above the openFDA ceiling without making a request', async () => {
    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
      skip: 25001,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('25000');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('omits skip and sort when not supplied', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });

    expect(fetchStub.calls[0]).not.toContain('skip=');
    expect(fetchStub.calls[0]).not.toContain('sort=');
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/adverse-events-query.test.ts`
Expected: FAIL — `skip` is not accepted by the handler.

- [ ] **Step 3: Extend the schema and handler**

In `src/drug/get-drug-adverse-events.ts`, export the ceiling near the top:

```ts
/** openFDA rejects skip above this: "Skip value must 25000 or less." */
export const SKIP_MAX = 25000;
```

Add to the Zod object, after `seriousness`:

```ts
    skip: z
      .number()
      .int()
      .min(0)
      .max(SKIP_MAX)
      .optional()
      .describe(
        `Offset into the result set, for paging past the limit. Maximum ${SKIP_MAX}.`
      ),
    sort: z
      .enum(['receivedate:desc', 'receivedate:asc'])
      .optional()
      .describe(
        'Order results by report receive date. Without it, results are a deterministic earliest-report_id slice, so a small sample is not representative.'
      ),
```

Extend the handler signature:

```ts
  async handler({
    drugName,
    limit,
    seriousness,
    skip,
    sort,
  }: {
    drugName: string;
    limit?: number;
    seriousness?: 'serious' | 'non-serious' | 'all';
    skip?: number;
    sort?: 'receivedate:desc' | 'receivedate:asc';
  }) {
```

Immediately inside the handler, before building the query, add the guard:

```ts
    // Validate locally rather than forwarding a request openFDA will reject
    // with an opaque BAD_REQUEST.
    if (skip !== undefined && skip > SKIP_MAX) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `skip must be ${SKIP_MAX} or less (openFDA's ceiling); received ${skip}. To reach records beyond that, narrow the search or use sort to bring the records you want into range.`,
          },
        ],
        isError: true,
      };
    }
```

Apply them to the builder chain — replace:

```ts
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(searchQuery)
      .limit(limit)
      .build();
```

with:

```ts
    const builder = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(searchQuery)
      .limit(limit);

    if (skip !== undefined) builder.skip(skip);
    if (sort !== undefined) builder.sort(sort);

    const url = builder.build();
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/adverse-events-query.test.ts`

Note: the Zod `.max(SKIP_MAX)` and the handler guard are deliberately both
present. The schema protects MCP callers; the handler guard protects direct
calls (which the tests make) and produces the readable message.

- [ ] **Step 5: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 6: Commit**

```bash
git add src/drug/get-drug-adverse-events.ts tests/adverse-events-query.test.ts
git commit -m "feat: add skip and sort to get-drug-adverse-events

Results were a deterministic earliest-report_id slice with no way past the
limit, so the first 10 of a limit-20 call were byte-identical to a limit-10
call and no sample could characterise 143,346 reports.

skip is validated locally against openFDA's measured 25000 ceiling rather
than forwarding a request that returns an opaque BAD_REQUEST.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: New tool `get-drug-adverse-event-counts` (L1)

**Files:**
- Create: `src/drug/get-drug-adverse-event-counts.ts`
- Create: `tests/adverse-event-counts.test.ts`
- Modify: `src/drug/index.ts`, `src/index.ts`

**Interfaces:**
- Consumes: `OpenFDABuilder.count()` (Task 1); `buildEventSearch`,
  `EVENT_MATCHED_VIA` (Task 2); `stubFetch` from `tests/helpers/stubFetch`.
- Produces: `getDrugAdverseEventCounts` tool definition, exported from
  `src/drug/index.ts`.

**Why a separate tool, not a `count` parameter:** a count response contains no
records and **no `meta.results.total`** (verified). It therefore cannot honour
the `Showing N of M` contract every other list tool follows. One tool returning
records-with-totals or terms-without-totals depending on a flag would be harder
to consume than two tools with one shape each.

**Countable fields** — each verified to aggregate against the live API.
`receivedate` is deliberately excluded: it returns `term: undefined`.

- [ ] **Step 1: Write the failing test**

Create `tests/adverse-event-counts.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugAdverseEventCounts } from '../src/drug/get-drug-adverse-event-counts';
import { stubFetch } from './helpers/stubFetch';

const countResponse = {
  meta: { disclaimer: 'x' },
  results: [
    { term: 'FATIGUE', count: 9480 },
    { term: 'NAUSEA', count: 8715 },
    { term: 'HEADACHE', count: 5001 },
  ],
};

describe('get-drug-adverse-event-counts', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([countResponse]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('aggregates by reaction term by default', async () => {
    await getDrugAdverseEventCounts.handler({ drugName: 'citalopram' });

    expect(fetchStub.calls[0]).toContain(
      'count=patient.reaction.reactionmeddrapt.exact'
    );
  });

  it('searches the same three indexes as the records tool', async () => {
    await getDrugAdverseEventCounts.handler({ drugName: 'citalopram' });

    const url = fetchStub.calls[0];
    expect(url).toContain('openfda.generic_name');
    expect(url).toContain('openfda.substance_name');
    expect(url).toContain('medicinalproduct');
    expect(url).toContain('+OR+');
  });

  it('returns ranked terms with counts', async () => {
    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({ term: 'FATIGUE', count: 9480 });
    expect(payload.results).toHaveLength(3);
  });

  it('states that a count response carries no result total', async () => {
    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
    });

    // openFDA omits meta.results.total on count responses. Saying so keeps
    // the absence from looking like the missing-totals bug fixed in 1.1.0.
    expect(result.content[0].text.toLowerCase()).toContain('no result total');
  });

  it('honours an explicit field and limit', async () => {
    await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
      field: 'occurcountry.exact',
      limit: 5,
    });

    expect(fetchStub.calls[0]).toContain('count=occurcountry.exact');
    expect(fetchStub.calls[0]).toContain('limit=5');
  });

  it('returns a clear message when nothing matches', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([{ meta: {}, results: [] }]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'notadrug',
    });

    expect(result.content[0].text).toContain('No adverse event counts');
    expect(result.isError).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/adverse-event-counts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the tool**

Create `src/drug/get-drug-adverse-event-counts.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { buildEventSearch, EVENT_MATCHED_VIA } from './event-search.js';

/**
 * Fields verified to aggregate against the live API. `receivedate` is
 * excluded deliberately: counting it returns `term: undefined`.
 */
const COUNTABLE_FIELDS = [
  'patient.reaction.reactionmeddrapt.exact',
  'patient.reaction.reactionoutcome',
  'serious',
  'patient.patientsex',
  'occurcountry.exact',
  'patient.drug.openfda.generic_name.exact',
] as const;

interface CountTerm {
  term: string;
  count: number;
}

export const getDrugAdverseEventCounts = {
  name: 'get-drug-adverse-event-counts',
  description:
    'Rank adverse-event values for a drug by frequency — for example the most commonly reported reactions. Returns aggregated {term, count} pairs, not individual reports. Note that openFDA omits a result total on aggregated responses, so this tool reports no total; use get-drug-adverse-events for individual reports and their total.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug name (brand, generic or substance)'),
    field: z
      .enum(COUNTABLE_FIELDS)
      .optional()
      .default('patient.reaction.reactionmeddrapt.exact')
      .describe('Field to aggregate by'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of ranked terms to return'),
  }),
  async handler({
    drugName,
    field,
    limit,
  }: {
    drugName: string;
    field?: (typeof COUNTABLE_FIELDS)[number];
    limit?: number;
  }) {
    const countField = field ?? 'patient.reaction.reactionmeddrapt.exact';
    const max = limit ?? 10;

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(buildEventSearch(drugName))
      .count(countField)
      .limit(max)
      .build();

    const { data, error } = await makeOpenFDARequest<{
      results?: CountTerm[];
    }>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to retrieve adverse event counts for "${drugName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!data?.results || data.results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No adverse event counts found for "${drugName}".`,
          },
        ],
      };
    }

    const payload = {
      matched_via: EVENT_MATCHED_VIA,
      counted_by: countField,
      returned: data.results.length,
      results: data.results,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Top ${data.results.length} values of ${countField} for "${drugName}" (aggregated responses carry no result total)\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/adverse-event-counts.test.ts`

- [ ] **Step 5: Register the tool**

In `src/drug/index.ts` add:

```ts
export { getDrugAdverseEventCounts } from './get-drug-adverse-event-counts.js';
```

In `src/index.ts`, add `getDrugAdverseEventCounts` to the import list from
`./drug/index.js` and add, after the other `registerTool` calls:

```ts
toolManager.registerTool(getDrugAdverseEventCounts);
```

- [ ] **Step 6: Verify nine tools register**

Run: `npm run build:cli` then:

```bash
node -e '
const {spawn}=require("child_process");
const c=spawn("node",["dist/index.js"],{env:{...process.env,OPENFDA_API_KEY:"x"},stdio:["pipe","pipe","pipe"]});
c.stderr.on("data",()=>{});let b="",id=1;
c.stdout.on("data",d=>{b+=d;if(b.includes("tools")&&b.includes("get-drug-adverse-event-counts")){
  const line=b.split("\n").find(l=>l.includes("tools"));
  console.log("tools:",JSON.parse(line).result.tools.length);c.kill();}});
c.stdin.write(JSON.stringify({jsonrpc:"2.0",id:id++,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"t",version:"1"}}})+"\n");
setTimeout(()=>{c.stdin.write(JSON.stringify({jsonrpc:"2.0",method:"notifications/initialized"})+"\n");
c.stdin.write(JSON.stringify({jsonrpc:"2.0",id:id++,method:"tools/list",params:{}})+"\n");},300);
setTimeout(()=>c.kill(),5000);'
```

Expected: `tools: 9`.

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 8: Commit**

```bash
git add src/drug/get-drug-adverse-event-counts.ts tests/adverse-event-counts.test.ts \
  src/drug/index.ts src/index.ts
git commit -m "feat: add get-drug-adverse-event-counts for frequency ranking

Ranking reactions by frequency — arguably the most common question about
adverse events — was unreachable: the schema had no count parameter and
additionalProperties was false.

A separate tool rather than a flag, because an aggregated response has no
records and no meta.results.total, so it cannot honour the Showing N of M
contract the record tools follow. The description says so explicitly, so
the missing total is not mistaken for the bug fixed in 1.1.0.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Rebuild `get-drugsfda` (N1, N2, N3, sponsor_name)

**Files:**
- Create: `src/drug/drugsfda-sections.ts`
- Create: `tests/drugsfda-sections.test.ts`
- Create: `scripts/probe-drugsfda-paths.mjs`
- Modify: `src/drug/get-drugsfda.ts`
- Test: `tests/drugsfda-tool.test.ts` (create)

**Interfaces:**
- Consumes: `summarizeResults`, `withTotals` from `src/utils/format.js`.
- Produces, from `src/drug/drugsfda-sections.ts`:
  - `SECTIONS` — the lookup table
  - `SECTION_NAMES: readonly string[]`
  - `resolveField(section, field): { ok: true; path: string; uppercase: boolean } | { ok: false; message: string }`

**Three defects in one file:**
- **N1** `.limit(1)` hardcoded, no total. `products.marketing_status:"Discontinued"` has 14,813 matches and returned one arbitrary record.
- **N2** `sectionName` is a bare `z.string()`, so a typo is indistinguishable from a genuine miss.
- **N3** Six advertised paths do not exist. `application.application_number`
  is mis-prefixed (the field is top-level), and **all five**
  `application_docs.*` field names are fabricated — the real shape is
  `submissions.application_docs.{id, url, date, type}`.

**Plus** `sponsor_name`, a real top-level field the schema never offered. It is
**case-sensitive and stored uppercase**: `"UPJOHN"` returns 13, `"Upjohn"` and
`"upjohn"` return NOT_FOUND. The handler upper-cases that field's value only —
`openfda.brand_name` is case-insensitive, so this is per-field, not index-wide.

- [ ] **Step 1: Write the failing table test**

Create `tests/drugsfda-sections.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  SECTIONS,
  SECTION_NAMES,
  resolveField,
} from '../src/drug/drugsfda-sections';

describe('SECTIONS', () => {
  it('offers exactly the five documented sections', () => {
    expect([...SECTION_NAMES].sort()).toEqual([
      'application',
      'application_docs',
      'openfda',
      'products',
      'submissions',
    ]);
  });

  it('emits application fields with NO prefix — they are top-level', () => {
    const r = resolveField('application', 'application_number');
    expect(r).toEqual({ ok: true, path: 'application_number', uppercase: false });
  });

  it('nests application_docs under submissions with its real field names', () => {
    const r = resolveField('application_docs', 'type');
    expect(r).toEqual({
      ok: true,
      path: 'submissions.application_docs.type',
      uppercase: false,
    });
  });

  it('never offers the six paths that do not exist upstream', () => {
    // These were advertised by 1.1.0 and match nothing.
    const fabricated = [
      'applications_doc_id',
      'applications_doc_date',
      'application_docs_title',
      'applications_doc_type',
      'applications_doc_url',
    ];
    for (const f of fabricated) {
      expect(resolveField('application_docs', f).ok).toBe(false);
    }
  });

  it('flags sponsor_name for uppercase normalisation, and nothing else', () => {
    expect(resolveField('application', 'sponsor_name')).toEqual({
      ok: true,
      path: 'sponsor_name',
      uppercase: true,
    });
    expect(resolveField('openfda', 'brand_name')).toEqual({
      ok: true,
      path: 'openfda.brand_name',
      uppercase: false,
    });
  });

  it('rejects an unknown section with a message naming the valid ones', () => {
    const r = resolveField('bogus', 'anything');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('bogus');
      for (const s of SECTION_NAMES) expect(r.message).toContain(s);
    }
  });

  it('rejects an unknown field with a message naming the valid fields', () => {
    const r = resolveField('products', 'not_a_field');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('not_a_field');
      expect(r.message).toContain('marketing_status');
    }
  });

  it('prefixes openfda, products and submissions with the section name', () => {
    expect(resolveField('openfda', 'generic_name')).toMatchObject({
      path: 'openfda.generic_name',
    });
    expect(resolveField('products', 'marketing_status')).toMatchObject({
      path: 'products.marketing_status',
    });
    expect(resolveField('submissions', 'submission_status')).toMatchObject({
      path: 'submissions.submission_status',
    });
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/drugsfda-sections.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the table**

Create `src/drug/drugsfda-sections.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Every path below was verified against the live API with an `_exists_`
 * probe (see scripts/probe-drugsfda-paths.mjs). Version 1.1.0 advertised six
 * paths that match nothing:
 *
 *   application.application_number        (application_number is TOP-LEVEL)
 *   application_docs.applications_doc_id      \
 *   application_docs.applications_doc_date     |  all five field names were
 *   application_docs.application_docs_title    |  fabricated; the real shape
 *   application_docs.applications_doc_type     |  is {id, url, date, type}
 *   application_docs.applications_doc_url     /
 *
 * `prefix` is what precedes the field in the query. An empty prefix means the
 * field is top-level and must be emitted bare.
 */
interface SectionDef {
  prefix: string;
  /** field name -> whether the search value must be upper-cased */
  fields: Record<string, { uppercase?: boolean }>;
}

export const SECTIONS: Record<string, SectionDef> = {
  application: {
    prefix: '',
    fields: {
      application_number: {},
      // Case-sensitive, stored uppercase: "UPJOHN" -> 13 results,
      // "Upjohn"/"upjohn" -> NOT_FOUND. Normalised so a caller typing
      // "Pfizer" does not get a silent miss that looks like absent data.
      sponsor_name: { uppercase: true },
    },
  },
  openfda: {
    prefix: 'openfda',
    fields: {
      application_number: {},
      brand_name: {},
      generic_name: {},
      manufacturer_name: {},
      route: {},
      substance_name: {},
      product_ndc: {},
    },
  },
  products: {
    prefix: 'products',
    fields: {
      dosage_form: {},
      marketing_status: {},
      product_number: {},
      reference_drug: {},
      route: {},
      te_code: {},
    },
  },
  submissions: {
    prefix: 'submissions',
    fields: {
      review_priority: {},
      submission_class_code: {},
      submission_number: {},
      submission_status: {},
      submission_status_date: {},
      submission_type: {},
    },
  },
  application_docs: {
    prefix: 'submissions.application_docs',
    fields: { id: {}, url: {}, date: {}, type: {} },
  },
};

export const SECTION_NAMES = Object.keys(SECTIONS) as readonly string[];

export type ResolveResult =
  | { ok: true; path: string; uppercase: boolean }
  | { ok: false; message: string };

/**
 * Resolve a (section, field) pair to a real query path, or explain why it is
 * not one. An invalid section or field must be distinguishable from a genuine
 * no-results — conflating the two is the defect this replaces.
 */
export function resolveField(section: string, field: string): ResolveResult {
  const def = SECTIONS[section];
  if (!def) {
    return {
      ok: false,
      message: `Unknown section "${section}". Valid sections: ${SECTION_NAMES.join(', ')}.`,
    };
  }

  const fieldDef = def.fields[field];
  if (!fieldDef) {
    return {
      ok: false,
      message: `Unknown field "${field}" for section "${section}". Valid fields: ${Object.keys(def.fields).join(', ')}.`,
    };
  }

  return {
    ok: true,
    path: def.prefix ? `${def.prefix}.${field}` : field,
    uppercase: fieldDef.uppercase === true,
  };
}
```

- [ ] **Step 4: Run and confirm the table tests pass**

Run: `npx vitest run tests/drugsfda-sections.test.ts`

- [ ] **Step 5: Write the failing handler test**

Create `tests/drugsfda-tool.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsfda } from '../src/drug/get-drugsfda';
import { stubFetch } from './helpers/stubFetch';

const hit = (total: number, n: number) => ({
  meta: { results: { skip: 0, limit: n, total } },
  results: Array.from({ length: n }, (_, i) => ({
    application_number: `NDA00000${i}`,
    sponsor_name: 'UPJOHN',
  })),
});

describe('get-drugsfda', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([hit(14813, 5)]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('returns more than one record and reports the real total', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'marketing_status',
      searchValue: 'Discontinued',
    });
    const text = result.content[0].text;

    expect(text).toContain('Showing 5 of 14813');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.total).toBe(14813);
    expect(payload.results).toHaveLength(5);
  });

  it('emits application fields with no prefix', async () => {
    await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'application_number',
      searchValue: 'NDA020702',
    });

    const url = decodeURIComponent(fetchStub.calls[0]);
    expect(url).toContain('search=application_number:"NDA020702"');
    expect(url).not.toContain('application.application_number');
  });

  it('nests application_docs under submissions', async () => {
    await getDrugsfda.handler({
      sectionName: 'application_docs',
      fieldName: 'type',
      searchValue: 'Label',
    });

    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'submissions.application_docs.type:"Label"'
    );
  });

  it('upper-cases sponsor_name but not brand_name', async () => {
    await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'sponsor_name',
      searchValue: 'Upjohn',
    });
    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'sponsor_name:"UPJOHN"'
    );

    fetchStub.restore();
    fetchStub = stubFetch([hit(1, 1)]);
    await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Lipitor',
    });
    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'openfda.brand_name:"Lipitor"'
    );
  });

  it('rejects an invalid section distinguishably from no-results, with no request', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'bogus',
      fieldName: 'brand_name',
      searchValue: 'Lipitor',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown section');
    expect(result.content[0].text).not.toContain('No results');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('rejects an invalid field for a valid section, with no request', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'not_a_field',
      searchValue: 'x',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown field');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('honours an explicit limit', async () => {
    await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'marketing_status',
      searchValue: 'Discontinued',
      limit: 20,
    });

    expect(fetchStub.calls[0]).toContain('limit=20');
  });
});
```

- [ ] **Step 6: Run and confirm failure**

Run: `npx vitest run tests/drugsfda-tool.test.ts`
Expected: FAIL — handler rejects `limit`, emits the old prefixed paths.

- [ ] **Step 7: Rewrite the handler**

Replace the whole of `src/drug/get-drugsfda.ts` after the header comment:

```ts
import z from 'zod';
import { OpenFDAResponse } from '../types.js';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { summarizeResults, withTotals } from '../utils/format.js';
import { SECTIONS, SECTION_NAMES, resolveField } from './drugsfda-sections.js';

const fieldList = (section: string) =>
  `${section}: ${Object.keys(SECTIONS[section]!.fields).join(', ')}`;

export const getDrugsfda = {
  name: 'get-drugsfda',
  description:
    'Search Drugs@FDA application data by section and field. Returns application, sponsor, product and submission records. Reports how many records matched in total, not just how many were returned.',
  inputSchema: z.object({
    sectionName: z
      .enum(SECTION_NAMES as [string, ...string[]])
      .describe(`Section to search. One of: ${SECTION_NAMES.join(', ')}`),
    fieldName: z
      .string()
      .describe(
        `Field within the section. ${SECTION_NAMES.map(fieldList).join('. ')}`
      ),
    searchValue: z
      .string()
      .describe(
        'Value to search for. Sponsor names are stored uppercase and are normalised automatically.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(5)
      .describe('Maximum number of records to return'),
  }),
  async handler({
    sectionName,
    fieldName,
    searchValue,
    limit,
  }: {
    sectionName: string;
    fieldName: string;
    searchValue: string;
    limit?: number;
  }) {
    const max = limit ?? 5;

    // Validate before any request, so a typo is never indistinguishable from
    // genuinely absent data.
    const resolved = resolveField(sectionName, fieldName);
    if (!resolved.ok) {
      return {
        content: [{ type: 'text' as const, text: resolved.message }],
        isError: true,
      };
    }

    const value = resolved.uppercase ? searchValue.toUpperCase() : searchValue;

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('drugsfda')
      .search(`${resolved.path}:"${value}"`)
      .limit(max)
      .build();

    const { data, error } = await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to retrieve Drugs@FDA data for "${value}" in ${resolved.path}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!data?.results || data.results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No Drugs@FDA records found for "${value}" in ${resolved.path}.`,
          },
        ],
      };
    }

    const total = data.meta?.results?.total;

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summarizeResults(data.results.length, total, `Drugs@FDA records matching ${resolved.path}`)}\n\n${JSON.stringify({ matched_via: resolved.path, ...withTotals(data.results, total, max) }, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 8: Run and confirm pass**

Run: `npx vitest run tests/drugsfda-tool.test.ts tests/drugsfda-sections.test.ts`

- [ ] **Step 9: Add the manual path prober**

Create `scripts/probe-drugsfda-paths.mjs`. It reads the table out of the
TypeScript source by regex rather than importing it — the built bundle does
not re-export `SECTIONS`, and a `.mjs` script cannot import a `.ts` module
directly:

```js
// Manual. Re-validates every advertised drugsfda path against the live API.
// This is the check that found six fabricated paths in 1.1.0.
// Run: node scripts/probe-drugsfda-paths.mjs
import { readFileSync } from 'node:fs';

const source = readFileSync('src/drug/drugsfda-sections.ts', 'utf8');
const KEY = process.env.OPENFDA_API_KEY;

// Extract prefix/field pairs from the table without importing TypeScript.
const sections = [...source.matchAll(/(\w+):\s*\{\s*prefix:\s*'([^']*)',\s*fields:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g)];

const probes = [];
for (const [, name, prefix, body] of sections) {
  for (const [, field] of body.matchAll(/(\w+):\s*\{/g)) {
    probes.push({ name, path: prefix ? `${prefix}.${field}` : field });
  }
}

let bad = 0;
for (const { name, path } of probes) {
  const qs = new URLSearchParams({ search: `_exists_:${path}`, limit: '1' });
  if (KEY) qs.set('api_key', KEY);
  const res = await fetch(`https://api.fda.gov/drug/drugsfda.json?${qs}`);
  const json = await res.json();
  const ok = !json.error && json.meta?.results?.total > 0;
  if (!ok) bad += 1;
  console.log(`  ${ok ? 'ok  ' : 'BAD '} ${name.padEnd(18)} ${path}`);
  await new Promise((r) => setTimeout(r, 60));
}

console.log(`\n${probes.length} paths probed, ${bad} invalid`);
process.exit(bad === 0 ? 0 : 1);
```

Add to `package.json` scripts:

```json
    "probe:drugsfda": "node scripts/probe-drugsfda-paths.mjs",
```

- [ ] **Step 10: Run the prober and confirm zero invalid paths**

Run: `npm run probe:drugsfda`
Expected: every line `ok`, final line `N paths probed, 0 invalid`, exit 0.

If any path reports BAD, fix the table — do not adjust the probe.

- [ ] **Step 11: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 12: Commit**

```bash
git add src/drug/drugsfda-sections.ts src/drug/get-drugsfda.ts \
  tests/drugsfda-sections.test.ts tests/drugsfda-tool.test.ts \
  scripts/probe-drugsfda-paths.mjs package.json
git commit -m "fix: rebuild get-drugsfda on verified paths, add limit and totals

Three defects in one tool:

- It hardcoded limit 1 with no total, so a search matching 14,813 records
  returned one arbitrary record and looked like a complete answer.
- sectionName was a bare string, so a typo returned the same message as a
  genuine miss.
- Six advertised paths matched nothing. application_number is top-level,
  not under application., and all five application_docs field names were
  fabricated — the real shape is submissions.application_docs.{id,url,
  date,type}.

Adds sponsor_name, a real top-level field never offered. It is
case-sensitive and stored uppercase, so its value is normalised;
openfda.brand_name is case-insensitive, so the flag is per-field.

scripts/probe-drugsfda-paths.mjs re-validates every path against the live
API — the check that caught the fabrications.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: One accepted-NDC-format block for both tools (N5)

**Files:**
- Create: `src/utils/ndc-formats.ts`
- Modify: `src/drug/get-drug-by-ndc.ts`, `src/drug/get-drug-by-product-ndc.ts`
- Test: `tests/ndc-formats.test.ts` (create)

**Interfaces:**
- Produces: `NDC_FORMATS: string` and
  `invalidNdcMessage(input: string, label: string): string` from
  `src/utils/ndc-formats.ts`.

**The defect:** `get-drug-by-ndc`'s rejection message lists only the 5-4
shapes, so a caller reading it would conclude `58151-155` is invalid — and
that is exactly the NDC `get-drug-by-name` returns for Lipitor. Its sibling
already has the full enumeration. Extracting one constant stops them drifting
again.

- [ ] **Step 1: Write the failing test**

Create `tests/ndc-formats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { NDC_FORMATS, invalidNdcMessage } from '../src/utils/ndc-formats';
import { getDrugByNdc } from '../src/drug/get-drug-by-ndc';
import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc';
import { stubFetch } from './helpers/stubFetch';
import { beforeEach, afterEach } from 'vitest';

describe('NDC_FORMATS', () => {
  it('lists every accepted form', () => {
    for (const form of ['4-4', '5-3', '5-4', '0456-4020', '58151-155']) {
      expect(NDC_FORMATS).toContain(form);
    }
  });

  it('explains why undashed 8 and 10 digits are refused', () => {
    expect(NDC_FORMATS).toContain('ambiguous');
    expect(NDC_FORMATS).toContain('8');
    expect(NDC_FORMATS).toContain('10');
  });

  it('builds a message naming the offending input', () => {
    expect(invalidNdcMessage('nope', 'NDC')).toContain('"nope"');
    expect(invalidNdcMessage('nope', 'NDC')).toContain(NDC_FORMATS);
  });
});

describe('both NDC tools reject with the same format list', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([{ meta: {}, results: [] }]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('neither omits 5-3 or 4-4', async () => {
    const a = await getDrugByNdc.handler({ ndcCode: 'nope' });
    const b = await getDrugByProductNdc.handler({ productNDC: 'nope' });

    for (const text of [a.content[0].text, b.content[0].text]) {
      expect(text).toContain('58151-155');
      expect(text).toContain('0456-4020');
      expect(text).toContain('ambiguous');
    }
    expect(fetchStub.calls.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/ndc-formats.test.ts`
Expected: FAIL — module not found, and `get-drug-by-ndc`'s message lacks the forms.

- [ ] **Step 3: Implement**

Create `src/utils/ndc-formats.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * One source of truth for what the NDC tools accept. Both tools render this,
 * so their messages cannot drift apart — get-drug-by-ndc previously listed
 * only the 5-4 shapes and would have told a caller that 58151-155 (the NDC
 * this server returns for Lipitor) was invalid.
 */
export const NDC_FORMATS = [
  '✅ Accepted formats:',
  '• 4-4 product NDC: 0456-4020',
  '• 5-3 product NDC: 58151-155',
  '• 5-4 product NDC: 12345-1234',
  '• Package NDC: 12345-1234-01 or 58151-155-01',
  '• Undashed 9 digits: 123451234 (read as 5-4)',
  '• Undashed 11 digits: 12345123401 (read as 5-4-2)',
  '',
  'Undashed 8- and 10-digit input is rejected because the split is ambiguous: 8 digits could be 5-3 or 4-4, and 10 could be 4-4-2, 5-3-2 or 5-4-1. Guessing could return a different drug, so add the dashes instead.',
].join('\n');

export const invalidNdcMessage = (input: string, label: string): string =>
  `Invalid ${label} format: "${input}"\n\n${NDC_FORMATS}`;
```

- [ ] **Step 4: Use it in both tools**

In `src/drug/get-drug-by-ndc.ts`, add:

```ts
import { invalidNdcMessage } from '../utils/ndc-formats.js';
```

and replace the invalid-format `text:` value with:

```ts
            text: invalidNdcMessage(ndcCode, 'NDC'),
```

In `src/drug/get-drug-by-product-ndc.ts`, add the same import and replace its
invalid-format `text:` value with:

```ts
            text: invalidNdcMessage(productNDC, 'product NDC'),
```

Update both tools' `describe()` text to mention 4-4, 5-3 and 5-4 rather than
only the 5-4 shapes.

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run tests/ndc-formats.test.ts tests/ndc.test.ts tests/product-ndc-tool.test.ts`

Note: `tests/product-ndc-tool.test.ts` asserts on the old message wording in
its ambiguity test (`toContain('ambiguous')`). That still holds. If any
assertion depended on exact old phrasing, update it to match the shared
constant — the constant is now the contract.

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/utils/ndc-formats.ts tests/ndc-formats.test.ts \
  src/drug/get-drug-by-ndc.ts src/drug/get-drug-by-product-ndc.ts \
  tests/product-ndc-tool.test.ts
git commit -m "fix: share one accepted-NDC-format block between both tools

get-drug-by-ndc listed only the 5-4 shapes, so it told callers that
58151-155 — the NDC this server returns for Lipitor — was invalid, while
its sibling documented every accepted form. One constant now renders both
messages so they cannot drift again.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Totals and generic-name backfill (L3, L5)

**Files:**
- Modify: `src/drug/get-drug-by-name.ts`, `src/drug/get-drug-safety-info.ts`
- Modify: `src/drug/resolve-label.ts` (add the backfill helper)
- Test: `tests/get-drug-by-name.test.ts`, `tests/resolve-label.test.ts`

**Interfaces:**
- Consumes: `resolveLabel`, `notFoundMessage` from `src/drug/resolve-label.js`.
- Produces: `resolveGenericName(openfda: Record<string, unknown>): string`
  exported from `src/drug/resolve-label.ts`.

**L3:** `get-drug-by-name` returns one label with no indication whether others
matched. Every other list-ish tool got a total in 1.1.0.

**L5:** A drug resolved through the `spl_product_data_elements` tier reports
`generic_name: "Unknown"` — Cordarone is amiodarone throughout its label.
The backfill tries `openfda.generic_name` then `openfda.substance_name`. It
does **not** parse `spl_product_data_elements`: that is a free-text blob, and
mining an ingredient out of it would be guesswork of the kind this project
rejects elsewhere. If both are absent, `'Unknown'` is the honest answer.

- [ ] **Step 1: Write the failing tests**

Append to `tests/resolve-label.test.ts`:

```ts
import { resolveGenericName } from '../src/drug/resolve-label';

describe('resolveGenericName', () => {
  it('prefers openfda.generic_name', () => {
    expect(
      resolveGenericName({
        generic_name: ['AMIODARONE HYDROCHLORIDE'],
        substance_name: ['AMIODARONE'],
      })
    ).toBe('AMIODARONE HYDROCHLORIDE');
  });

  it('falls back to substance_name', () => {
    expect(resolveGenericName({ substance_name: ['AMIODARONE'] })).toBe(
      'AMIODARONE'
    );
  });

  it('treats an empty array as absent', () => {
    expect(
      resolveGenericName({ generic_name: [], substance_name: ['AMIODARONE'] })
    ).toBe('AMIODARONE');
  });

  it('says Unknown honestly when neither field is present', () => {
    // It does NOT mine spl_product_data_elements — that is free text and
    // extracting an ingredient from it would be guesswork.
    expect(resolveGenericName({})).toBe('Unknown');
  });
});
```

Append to `tests/get-drug-by-name.test.ts`:

```ts
  it('reports how many labels matched, not just the one returned', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 37 } },
        results: [{ openfda: { brand_name: ['OXYCONTIN'] } }],
      },
    ]);

    const result = await getDrugByName.handler({ drugName: 'OxyContin' });
    const text = result.content[0].text;

    expect(text).toContain('37');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.total).toBe(37);
  });
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/resolve-label.test.ts tests/get-drug-by-name.test.ts`

- [ ] **Step 3: Implement the backfill**

Append to `src/drug/resolve-label.ts`:

```ts
/**
 * openfda.generic_name is absent on some labels — notably ones reached through
 * the spl_product_data_elements tier, which reported "Unknown" for Cordarone
 * despite the label being amiodarone throughout.
 *
 * Deliberately does NOT parse spl_product_data_elements: it is a free-text
 * blob of product elements, and extracting an ingredient from it would be
 * guesswork. When neither structured field is present, "Unknown" is honest.
 */
export function resolveGenericName(
  openfda: Record<string, unknown>
): string {
  const first = (value: unknown): string | undefined =>
    Array.isArray(value) && typeof value[0] === 'string' && value[0]
      ? value[0]
      : undefined;

  return first(openfda?.generic_name) ?? first(openfda?.substance_name) ?? 'Unknown';
}
```

- [ ] **Step 4: Use it in `get-drug-safety-info`**

Add to the imports:

```ts
import { resolveLabel, notFoundMessage, resolveGenericName } from './resolve-label.js';
```

Replace:

```ts
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
```

with:

```ts
      generic_name: resolveGenericName(
        (drug?.openfda ?? {}) as Record<string, unknown>
      ),
```

- [ ] **Step 5: Add the total to `get-drug-by-name`**

Add the import:

```ts
import { summarizeResults, withTotals } from '../utils/format.js';
```

Replace the success return's `text:` with:

```ts
          text: `${summarizeResults(1, resolved.data.meta?.results?.total, `labels matching "${drugName}"`)}\n\n${JSON.stringify(withTotals([drugInfo], resolved.data.meta?.results?.total, 1), null, 2)}`,
```

- [ ] **Step 6: Run and confirm pass**

Run: `npx vitest run tests/resolve-label.test.ts tests/get-drug-by-name.test.ts`

- [ ] **Step 7: Check L5 against live data**

The spec requires confirming `substance_name` is actually populated for
Cordarone. Run:

```bash
node -e '
(async()=>{
  const r=await fetch(`https://api.fda.gov/drug/label.json?search=spl_product_data_elements:"Cordarone"&limit=1`);
  const j=await r.json();
  const o=j.results[0].openfda;
  console.log("generic_name :", JSON.stringify(o.generic_name));
  console.log("substance_name:", JSON.stringify(o.substance_name));
})()'
```

If BOTH are absent, L5 is **not fixable by backfill**. In that case leave the
code as written (it is still correct for labels that do have the fields), and
report in your task report that L5 does not reproduce a fix for Cordarone
specifically, with this output as evidence. Do not fabricate a name.

- [ ] **Step 8: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 9: Commit**

```bash
git add src/drug/resolve-label.ts src/drug/get-drug-safety-info.ts \
  src/drug/get-drug-by-name.ts tests/resolve-label.test.ts \
  tests/get-drug-by-name.test.ts
git commit -m "feat: report label totals and backfill generic_name

get-drug-by-name returned one label with no indication whether others
matched, while every other list-ish tool gained a total in 1.1.0.

generic_name now falls back to openfda.substance_name, so a drug reached
through the spl_product_data_elements tier stops reporting Unknown. It
deliberately does not mine spl_product_data_elements itself — that is free
text, and extracting an ingredient would be guesswork.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Make `matched_via` universal (L4)

**Files:**
- Modify: `src/drug/get-drugs-by-manufacturer.ts`, `src/drug/get-drug-by-ndc.ts`
- Test: `tests/matched-via.test.ts` (create)

**Interfaces:**
- Consumes: nothing new. `get-drugsfda` already gained `matched_via` in Task 5;
  the event tools in Tasks 2 and 4.
- Produces: no new exports.

`matched_via` proved genuinely useful for diagnosing which search path ran, but
it is present on only some tools. After this task every search tool reports it.

- [ ] **Step 1: Write the failing test**

Create `tests/matched-via.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsByManufacturer } from '../src/drug/get-drugs-by-manufacturer';
import { getDrugByNdc } from '../src/drug/get-drug-by-ndc';
import { stubFetch } from './helpers/stubFetch';

describe('matched_via is reported by every search tool', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('get-drugs-by-manufacturer names the field it searched', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 20, total: 397 } },
        results: [{ openfda: { brand_name: ['A'] } }],
      },
    ]);

    const result = await getDrugsByManufacturer.handler({
      manufacturerName: 'American Health Packaging',
      limit: 20,
    });

    expect(result.content[0].text).toContain(
      '"matched_via": "openfda.manufacturer_name"'
    );
  });

  it('get-drug-by-ndc names the NDC field it searched', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 10, total: 1 } },
        results: [
          { openfda: { brand_name: ['LIPITOR'], package_ndc: ['58151-155-01'] } },
        ],
      },
    ]);

    const result = await getDrugByNdc.handler({ ndcCode: '58151-155' });

    expect(result.content[0].text).toContain('"matched_via"');
    expect(result.content[0].text).toContain('product_ndc');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/matched-via.test.ts`

- [ ] **Step 3: Add it to `get-drugs-by-manufacturer`**

In the success return, change the `JSON.stringify(withTotals(...))` argument to
spread `matched_via` first:

```ts
          text: `${summarizeResults(drugs.length, drugData.meta?.results?.total, `labels from manufacturer "${manufacturerName}"`)}\n\n${JSON.stringify({ matched_via: 'openfda.manufacturer_name', ...withTotals(drugs, drugData.meta?.results?.total, limit ?? 20) }, null, 2)}`,
```

- [ ] **Step 4: Add it to `get-drug-by-ndc`**

That handler already computes `searchQuery` from the product and optional
package NDC. Record which it used. After the `searchQuery` is built, add:

```ts
    const matchedVia = packageNDC
      ? 'openfda.product_ndc OR openfda.package_ndc'
      : 'openfda.product_ndc';
```

and include it in the success payload:

```ts
          text: `${summarizeResults(results.length, drugData.meta?.results?.total, `labels for NDC "${ndcCode}"`)} with ${totalPackages} package(s)\n\n${searchSummary}\n\n${JSON.stringify({ matched_via: matchedVia, ...withTotals(results, drugData.meta?.results?.total, 10) }, null, 2)}`,
```

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run tests/matched-via.test.ts tests/ndc-query.test.ts`

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/drug/get-drugs-by-manufacturer.ts src/drug/get-drug-by-ndc.ts \
  tests/matched-via.test.ts
git commit -m "feat: report matched_via from every search tool

matched_via proved useful for diagnosing which search path ran, but was
present on only some tools. Every search tool now reports it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Descriptions and the drift guard (N6)

**Files:**
- Modify: `src/drug/get-drug-by-name.ts`, `src/drug/get-drug-safety-info.ts`
- Modify: every tool definition, to add `returnsFields`
- Test: `tests/description-drift.test.ts` (create)

**Interfaces:**
- Produces: an optional `returnsFields?: readonly string[]` property on each
  tool definition object. `ToolManager` ignores it; it exists for the guard.

**The defect:** `get-drug-by-name` returns `boxed_warning` and
`warnings_and_cautions` but its description names neither, so a model choosing
tools from descriptions cannot know it supplies a boxed warning — the headline
fix of 1.1.0. This is the same drift class that let six fabricated
`application_docs` field names ship.

- [ ] **Step 1: Write the failing test**

Create `tests/description-drift.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { getDrugSafetyInfo } from '../src/drug/get-drug-safety-info';

const TOOLS = [
  { name: 'get-drug-by-name', tool: getDrugByName },
  { name: 'get-drug-safety-info', tool: getDrugSafetyInfo },
];

describe('tool descriptions do not drift from what tools return', () => {
  for (const { name, tool } of TOOLS) {
    it(`${name} declares the fields it returns`, () => {
      expect(Array.isArray((tool as any).returnsFields)).toBe(true);
      expect((tool as any).returnsFields.length).toBeGreaterThan(0);
    });

    it(`${name}'s description mentions every field it declares`, () => {
      for (const field of (tool as any).returnsFields as string[]) {
        expect(
          tool.description,
          `${name} returns "${field}" but never names it in its description`
        ).toContain(field);
      }
    });
  }

  it('get-drug-by-name advertises the boxed warning it returns', () => {
    // The headline fix of 1.1.0 was invisible to a model reading the schema.
    expect(getDrugByName.description).toContain('boxed_warning');
    expect((getDrugByName as any).returnsFields).toContain('boxed_warning');
  });
});

describe('declared fields are actually returned', () => {
  // The half of the guard that catches fabrication: a tool could name a
  // field in both its description and returnsFields and still never emit
  // it — which is exactly how five invented application_docs field names
  // shipped. Drive each handler and compare against real output keys.
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            openfda: {
              brand_name: ['ZESTRIL'],
              generic_name: ['LISINOPRIL'],
              manufacturer_name: ['X'],
              product_ndc: ['12345-1234'],
              substance_name: ['LISINOPRIL'],
            },
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('get-drug-by-name emits every field it declares', async () => {
    const result = await getDrugByName.handler({ drugName: 'Zestril' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const emitted = payload.results ? payload.results[0] : payload;

    for (const field of (getDrugByName as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(emitted, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-safety-info emits every field it declares', async () => {
    const result = await getDrugSafetyInfo.handler({ drugName: 'Zestril' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugSafetyInfo as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });
});
```

The new block needs these imports at the top of the file:

```ts
import { beforeEach, afterEach } from 'vitest';
import { stubFetch } from './helpers/stubFetch';
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/description-drift.test.ts`
Expected: FAIL — `returnsFields` is undefined.

- [ ] **Step 3: Declare and describe the fields**

In `src/drug/get-drug-by-name.ts`, add to the exported object, after
`description`:

```ts
  returnsFields: [
    'brand_name',
    'generic_name',
    'manufacturer_name',
    'product_ndc',
    'substance_name',
    'boxed_warning',
    'warnings',
    'warnings_and_cautions',
    'do_not_use',
    'ask_doctor',
    'stop_use',
    'pregnancy_or_breast_feeding',
    'indications_and_usage',
    'matched_via',
  ] as const,
```

and replace its `description` with one naming them:

```ts
  description:
    'Look up a drug by brand, generic or substance name. Returns brand_name, generic_name, manufacturer_name, product_ndc, substance_name, indications_and_usage, and the safety narrative: boxed_warning, warnings, warnings_and_cautions, do_not_use, ask_doctor, stop_use and pregnancy_or_breast_feeding. Every field is always present, empty when the label has none. Reports matched_via to say which field matched, and a total for how many labels matched.',
```

In `src/drug/get-drug-safety-info.ts`, add:

```ts
  returnsFields: [
    'drug_name',
    'generic_name',
    'matched_via',
    'boxed_warning',
    'warnings',
    'warnings_and_cautions',
    'contraindications',
    'drug_interactions',
    'precautions',
    'adverse_reactions',
    'overdosage',
    'do_not_use',
    'ask_doctor',
    'stop_use',
    'pregnancy_or_breast_feeding',
  ] as const,
```

and replace its `description`:

```ts
  description:
    'Get safety information for a drug. Returns drug_name, generic_name, boxed_warning, warnings, warnings_and_cautions, contraindications, drug_interactions, precautions, adverse_reactions, overdosage, do_not_use, ask_doctor, stop_use and pregnancy_or_breast_feeding. Every field is always present, empty when the label has none, so an empty boxed_warning means the drug has none rather than that it was not checked. Accepts a brand, generic or substance name and reports matched_via.',
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run tests/description-drift.test.ts`

- [ ] **Step 5: Confirm `ToolManager` tolerates the extra property**

`ToolDefinition` in `src/ToolManager.ts` does not declare `returnsFields`.
TypeScript object literals assigned to a typed parameter reject excess
properties, but these objects are declared standalone and passed by reference,
so excess-property checking does not apply. Confirm with:

Run: `npm run typecheck`

If it does error, add `returnsFields?: readonly string[];` to the
`ToolDefinition` type rather than removing the property.

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint`

- [ ] **Step 7: Commit**

```bash
git add src/drug/get-drug-by-name.ts src/drug/get-drug-safety-info.ts \
  tests/description-drift.test.ts src/ToolManager.ts
git commit -m "fix: make tool descriptions name every field they return

get-drug-by-name returned boxed_warning and warnings_and_cautions while
advertising neither, so a model picking tools from descriptions could not
know it supplies a boxed warning — the headline fix of 1.1.0.

Each tool now declares returnsFields, and a test asserts the description
names every declared field. This is the drift class that let six
fabricated application_docs field names ship.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Documentation and version bump

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `package.json`
- Modify: `scripts/smoke-local.mjs`

**Interfaces:**
- Consumes: the behaviour of Tasks 1-9.

- [ ] **Step 1: Document the new tool in the README**

Add `get-drug-adverse-event-counts` to the Features list, describing it as
ranking adverse-event values by frequency and noting it reports no result
total because openFDA omits one on aggregated responses.

Add it to the `autoApprove` array in the example config, which must now list
all **nine** tools.

- [ ] **Step 2: Document the new parameters**

In the README, note that `get-drug-adverse-events` accepts `skip` (maximum
25000) and `sort` (`receivedate:desc` / `receivedate:asc`), and that without
`sort` the results are a deterministic earliest-`report_id` slice.

Note that `get-drugsfda` accepts `limit` and can search by `sponsor_name`,
which is stored uppercase and normalised automatically.

- [ ] **Step 3: Update CLAUDE.md**

- Test count and file list: run `npm run test:ci` and use the real figures.
- Add `src/drug/event-search.ts`, `src/drug/drugsfda-sections.ts`,
  `src/utils/ndc-formats.ts` to Key Modules with one line each.
- Add `scripts/probe-drugsfda-paths.mjs` (`npm run probe:drugsfda`) beside the
  other manual scripts, noting it hits the live API and is not in CI.
- Update the Available Tools list to nine entries, correcting
  `get-drugsfda`'s description to the verified sections and fields.
- Add `npm run probe:drugsfda` to the Commands block.

- [ ] **Step 4: Extend the smoke script**

In `scripts/smoke-local.mjs`, add checks for the round 2 fixes:

```js
  t = await call('get-drug-adverse-event-counts', { drugName: 'citalopram', limit: 3 });
  show('L1  adverse-event counts rank terms by frequency', t, [
    ['returns ranked terms', /"term":/.test(t) && /"count":/.test(t)],
    ['states it has no total', /no result total/i.test(t)],
  ]);

  t = await call('get-drugsfda', {
    sectionName: 'products',
    fieldName: 'marketing_status',
    searchValue: 'Discontinued',
    limit: 3,
  });
  show('N1  get-drugsfda reports a real total', t, [
    ['shows N of M', /Showing 3 of \d{3,}/.test(t)],
  ]);

  t = await call('get-drugsfda', {
    sectionName: 'application',
    fieldName: 'sponsor_name',
    searchValue: 'Upjohn',
  });
  show('sponsor_name is normalised to uppercase', t, [
    ['found despite mixed-case input', !/No Drugs@FDA records/.test(t)],
  ]);

  t = await call('get-drugsfda', {
    sectionName: 'bogus',
    fieldName: 'x',
    searchValue: 'y',
  });
  show('N2  invalid section is distinguishable from no-results', t, [
    ['names the problem', /Unknown section/.test(t)],
    ['does not look like a miss', !/No Drugs@FDA records/.test(t)],
  ]);
```

- [ ] **Step 5: Bump the version**

In `package.json`, set `"version": "1.2.0"`.

- [ ] **Step 6: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint && npm run build:cli`

Then run the live checks:

```bash
npm run probe:drugsfda
npm run smoke
```

Expected: probe reports 0 invalid paths; smoke reports no FAIL lines.

- [ ] **Step 7: Confirm the published-version guard still holds**

Run: `npx vitest run tests/version.test.ts`
Expected: PASS — `serverInfo` is still sourced from `package.json`, now 1.2.0.

- [ ] **Step 8: Commit**

```bash
git add README.md CLAUDE.md package.json scripts/smoke-local.mjs
git commit -m "docs: document round 2 changes; bump to 1.2.0

Nine tools now, with the new counts tool, skip/sort on adverse events, and
limit plus sponsor_name on get-drugsfda.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Deferred

Nothing from the spec. Every defect, limitation and the `sponsor_name`
capability is covered above.

## Operational follow-up

The openFDA API key exposed by published 1.0.19 still needs rotating at
https://open.fda.gov/apis/authentication/. No code change in this release, or
the last one, recalls a key already distributed.
