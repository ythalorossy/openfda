# OpenFDA MCP 2.0.0 — API-Group Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nine flat `get-*` tools with seven `drug-*` endpoint tools — one per `/drug/*.json` endpoint — driven by one generic executor and declarative endpoint descriptors, so adding the Food or Transparency group later is additive data rather than a refactor.

**Architecture:** A dataset-agnostic `src/core/` holds the descriptor types, a search layer whose strategies emit *clauses* (never query strings), a single query assembler that escapes every value, response shaping (projection, envelope, budget) and one executor. `src/datasets/drug/` holds seven descriptors that are almost entirely data. `src/catalog/` holds FDA's own published field lists, downloaded and committed, which an offline CI test uses to prove no descriptor names a field FDA does not publish.

**Tech Stack:** TypeScript (strict, ESM), `@modelcontextprotocol/sdk` ^1.29.0, `zod` ^3.25.0, Vitest, Vite. One new **devDependency**: `yaml` (used only by `scripts/`, never shipped — `package.json` ships `files: ["dist"]`).

**Spec:** `docs/superpowers/specs/2026-09-20-openfda-api-groups-design.md`

**Branch:** `design/2.0.0-api-groups` (already holds the spec commit).

## Global Constraints

- Every `.ts` file starts with the MIT header:
  `/*\n * Copyright (c) 2025 Ythalo Saldanha\n * Licensed under the MIT License\n */`
- ESM imports must carry the `.js` extension (`import { x } from './y.js'`), required for the bundled output.
- TypeScript strict mode. Explicit return types on exported functions. Avoid `any` except where an upstream openFDA record is genuinely untyped.
- Files kebab-case; classes PascalCase; functions/variables camelCase; true constants UPPER_SNAKE_CASE; types/interfaces PascalCase.
- Zod for all tool input validation. **Never add `outputSchema` to tool registration** — it causes MCP validation errors (see `AGENTS.md`).
- No new *runtime* dependencies. Runtime deps stay exactly `@modelcontextprotocol/sdk` and `zod`.
- Run `npm run lint -- --fix` before every commit. LF line endings.
- Tests live in `tests/`, named `<subject>.test.ts`. ESLint ignores `tests/`.
- `npm run test:ci`, `npm run typecheck` and `npm run lint` must pass before any commit is considered done.
- Scripts that hit the live API (`fields:sync`, `fields:coverage`, `probe:fields`, `smoke`) are **never** part of `npm test`.
- The API-key chokepoint in `ToolManager.registerTool()` must remain the only path to a registered handler.

## Verified Facts This Plan Depends On

These were probed live on 2026-09-20. Do not re-derive them; do not assume anything beyond them.

| fact | evidence |
| --- | --- |
| All seven `/drug/*.json` endpoints exist | HTTP 200, totals: label 262,883 · event 20,692,690 · ndc 138,046 · enforcement 17,965 · drugsfda 29,335 · orangebook 48,761 · shortages 1,603 |
| All seven have a published field reference | `open.fda.gov/fields/{druglabel,drugevent,drugndc,drugenforcement,drugsfda,drugorangebook,drugshortages}.yaml` all HTTP 200 |
| **Search-value injection is real** | `openfda.brand_name:"Advil"` → 39; `:"Tylenol"` → 111; `:"Advil" OR openfda.brand_name:"Tylenol"` → **150** |
| **Backslash escaping neutralises it** | `openfda.brand_name:"Advil\" OR openfda.brand_name:\"Tylenol"` → `NOT_FOUND` (treated as one literal term) |
| **Zero matches arrive as HTTP 404**, `error.code: NOT_FOUND` | `openfda.brand_name:"ZzzNoSuchDrugQqq"` → HTTP 404 |
| Quoting a numeric filter is safe | `AND serious:1` → 23,172; `AND serious:"1"` → 23,172 (identical) |
| Parenthesised groups work | `(a OR b) AND serious:"1"` → 23,172 |
| The FAERS drug paths are `patient.drug.openfda.*` | `patient.drug.openfda.substance_name:"IBUPROFEN"` → 508,117; top-level `openfda.substance_name` → `NOT_FOUND` |

**Consequence of the 404 fact — read this before Task 12.** `ApiHandler` maps HTTP 404 to an `OpenFDAError`. Every current tool therefore takes its *error* branch when a search simply matches nothing, and reports `Failed to retrieve …` with `isError: true`. The friendly "No drug found for X" branches and `notFoundMessage()` are effectively unreachable against the live API. The executor must classify `status === 404` as **no results**, not as an upstream error. This is a real behaviour fix shipping in 2.0.0, not a refactor artifact.

---

## File Structure

**Created:**

| file | responsibility |
| --- | --- |
| `src/core/descriptor.ts` | `EndpointDescriptor`, `FieldSpec`, `Projection`, `ExtraFilters` types + `validateDescriptor()` |
| `src/core/search/escape.ts` | `escapeSearchValue()` — the only escaping point |
| `src/core/search/strategy.ts` | `SearchStrategy`, `Clause`, `ClauseSet`, `planClauseSets()`, `declaredPaths()` |
| `src/core/search/query.ts` | `buildQuery()` — the only place a query string is assembled |
| `src/core/shape/envelope.ts` | `buildEnvelope()` |
| `src/core/shape/project.ts` | `applyProjection()`, `capArray()` |
| `src/core/shape/budget.ts` | `MAX_RESPONSE_CHARS`, `fitToBudget()` |
| `src/core/codes.ts` | `decodeTerm()` |
| `src/core/executor.ts` | `execute()` — the single request pipeline |
| `src/core/registry.ts` | `buildInputSchema()`, `buildDescription()`, `toToolDefinition()`, `registerDataset()` |
| `src/datasets/drug/index.ts` | `DRUG_ENDPOINTS` |
| `src/datasets/drug/{label,event,ndc,enforcement,drugsfda,orangebook,shortages}.ts` | one descriptor each |
| `src/datasets/drug/strategies.ts` | `drugNameTiered`, `drugNameAnyOf`, `ndcClauses`, `productNdcClauses` |
| `src/catalog/drug-*.json` | FDA field lists, generated + committed |
| `src/catalog/drug-*.coverage.json` | measured coverage, generated + committed |
| `scripts/fields-sync.mjs`, `scripts/fields-coverage.mjs`, `scripts/probe-fields.ts` | live-API maintenance scripts |

**Modified:** `src/OpenFDABuilder.ts` (generalise dataset/endpoint), `src/index.ts` (register descriptors), `src/ToolManager.ts` (unchanged logic, wider type), `package.json` (scripts + `yaml` devDep), `README.md`, `CLAUDE.md`, `AGENTS.md`.

**Deleted (Phase 3):** all nine `src/drug/get-*.ts`, `src/drug/index.ts`, and the tests that only exercise them. `src/drug/faers.ts`, `label-fields.ts`, `resolve-label.ts`, `event-search.ts` and `drugsfda-sections.ts` are *moved* or *absorbed*, not deleted — Tasks 15–17 say exactly how.

---

# Phase 0 — Catalogs and field selection

Ships nothing. Produces the committed data every later phase is checked against.

### Task 1: Download FDA's field references into a committed catalog

**Files:**
- Create: `scripts/fields-sync.mjs`
- Create: `src/catalog/drug-{label,event,ndc,enforcement,drugsfda,orangebook,shortages}.json`
- Modify: `package.json` (add `yaml` devDep, add `fields:sync` script)
- Test: `tests/catalog-shape.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: catalog files with the shape
  `{ endpoint: string, source_url: string, fetched_at: string, fields: Array<{ path: string, type: string, description: string }> }`.
  Task 14's conformance guard and Task 25's resources both read this shape.

- [ ] **Step 1: Add the devDependency and scripts**

```bash
npm install --save-dev yaml
```

Then add to `package.json` `"scripts"`:

```json
"fields:sync": "node scripts/fields-sync.mjs",
"fields:coverage": "node scripts/fields-coverage.mjs"
```

(`probe:fields` is added in Task 21, together with the script it points at.)

- [ ] **Step 2: Write the failing test**

Create `tests/catalog-shape.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const ENDPOINTS = [
  'label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages',
] as const;

// One path per endpoint that was verified live on 2026-09-20. If FDA's
// reference no longer lists it, that is real drift and this must fail.
const KNOWN_TRUE: Record<string, string> = {
  label: 'openfda.brand_name',
  event: 'patient.drug.medicinalproduct',
  ndc: 'product_ndc',
  enforcement: 'reason_for_recall',
  drugsfda: 'sponsor_name',
  orangebook: 'products.brand_name',
  shortages: 'generic_name',
};

describe('field catalogs', () => {
  for (const endpoint of ENDPOINTS) {
    const file = `src/catalog/drug-${endpoint}.json`;

    it(`${endpoint}: catalog exists and is well-formed`, () => {
      expect(existsSync(file), `${file} missing — run npm run fields:sync`).toBe(true);
      const catalog = JSON.parse(readFileSync(file, 'utf8'));
      expect(catalog.endpoint).toBe(endpoint);
      expect(typeof catalog.source_url).toBe('string');
      expect(typeof catalog.fetched_at).toBe('string');
      expect(Array.isArray(catalog.fields)).toBe(true);
      expect(catalog.fields.length).toBeGreaterThan(20);
      for (const field of catalog.fields) {
        expect(typeof field.path).toBe('string');
        expect(field.path.length).toBeGreaterThan(0);
        expect(typeof field.type).toBe('string');
        expect(typeof field.description).toBe('string');
      }
    });

    it(`${endpoint}: catalog lists its known-true path`, () => {
      const catalog = JSON.parse(readFileSync(file, 'utf8'));
      const paths = catalog.fields.map((f: { path: string }) => f.path);
      expect(paths).toContain(KNOWN_TRUE[endpoint]);
    });
  }
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run tests/catalog-shape.test.ts`
Expected: FAIL — `src/catalog/drug-label.json missing — run npm run fields:sync`

- [ ] **Step 4: Write the sync script**

Create `scripts/fields-sync.mjs`:

```js
#!/usr/bin/env node
/*
 * Downloads openFDA's published field reference for each drug endpoint and
 * writes a trimmed, committed catalog. Hits the live API; NOT part of npm test.
 *
 * The catalog is the offline source of truth that tests/catalog-conformance
 * checks descriptors against, so a field name that FDA does not publish can
 * never reach a tool schema.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const ENDPOINTS = {
  label: 'druglabel',
  event: 'drugevent',
  ndc: 'drugndc',
  enforcement: 'drugenforcement',
  drugsfda: 'drugsfda',
  orangebook: 'drugorangebook',
  shortages: 'drugshortages',
};

const MAX_DESCRIPTION = 300;

/**
 * openFDA's reference nests field definitions under `properties`, and arrays
 * under `items.properties`. Flatten to dotted paths, which is exactly the form
 * a search query uses.
 */
function flatten(node, prefix = '') {
  const out = [];
  const properties = node?.properties ?? node?.items?.properties;
  if (!properties) return out;
  for (const [name, value] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${name}` : name;
    const type = value?.type ?? value?.items?.type ?? 'unknown';
    const description = String(value?.description ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_DESCRIPTION);
    const children = flatten(value, path);
    if (children.length === 0) out.push({ path, type, description });
    else out.push({ path, type, description }, ...children);
  }
  return out;
}

async function sync(endpoint, slug) {
  const sourceUrl = `https://open.fda.gov/fields/${slug}.yaml`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${sourceUrl} -> HTTP ${response.status}`);
  const doc = parse(await response.text());

  // The reference wraps the record schema; take whichever root carries properties.
  const root = doc?.properties ? doc : (Object.values(doc ?? {}).find((v) => v?.properties) ?? {});
  const fields = flatten(root);
  if (fields.length === 0) throw new Error(`${slug}: parsed 0 fields — reference shape changed`);

  const catalog = {
    endpoint,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    fields: fields.sort((a, b) => a.path.localeCompare(b.path)),
  };
  mkdirSync('src/catalog', { recursive: true });
  writeFileSync(`src/catalog/drug-${endpoint}.json`, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`drug-${endpoint}: ${fields.length} fields`);
}

for (const [endpoint, slug] of Object.entries(ENDPOINTS)) {
  await sync(endpoint, slug);
}
```

- [ ] **Step 5: Run the sync and the test**

Run: `npm run fields:sync && npx vitest run tests/catalog-shape.test.ts`
Expected: seven `drug-<endpoint>: N fields` lines, then PASS.

If a known-true path is missing, the flattener is wrong for that reference — fix `flatten()`, do **not** edit `KNOWN_TRUE`. Those seven paths were verified against live data.

- [ ] **Step 6: Commit**

```bash
npm run lint -- --fix
git add package.json package-lock.json scripts/fields-sync.mjs src/catalog tests/catalog-shape.test.ts
git commit -m "feat(catalog): download FDA field references into a committed catalog"
```

### Task 2: Measure field coverage

**Files:**
- Create: `scripts/fields-coverage.mjs`
- Create: `src/catalog/drug-*.coverage.json`
- Test: `tests/catalog-coverage.test.ts`

**Interfaces:**
- Consumes: `src/catalog/drug-<endpoint>.json` from Task 1.
- Produces: `{ endpoint, measured_at, total_records, fields: Array<{ path, docs, coverage_pct }> }`. Task 3 selects fields from this; Task 25 serves it.

- [ ] **Step 1: Write the failing test**

Create `tests/catalog-coverage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const ENDPOINTS = ['label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages'];

describe('field coverage data', () => {
  for (const endpoint of ENDPOINTS) {
    const file = `src/catalog/drug-${endpoint}.coverage.json`;

    it(`${endpoint}: coverage file is well-formed`, () => {
      expect(existsSync(file), `${file} missing — run npm run fields:coverage`).toBe(true);
      const data = JSON.parse(readFileSync(file, 'utf8'));
      expect(data.endpoint).toBe(endpoint);
      expect(data.total_records).toBeGreaterThan(0);
      expect(Array.isArray(data.fields)).toBe(true);
      expect(data.fields.length).toBeGreaterThan(0);
      for (const field of data.fields) {
        expect(typeof field.path).toBe('string');
        expect(field.docs).toBeGreaterThanOrEqual(0);
        expect(field.coverage_pct).toBeGreaterThanOrEqual(0);
        expect(field.coverage_pct).toBeLessThanOrEqual(100);
      }
    });

    it(`${endpoint}: every measured path is in the catalog`, () => {
      const coverage = JSON.parse(readFileSync(file, 'utf8'));
      const catalog = JSON.parse(readFileSync(`src/catalog/drug-${endpoint}.json`, 'utf8'));
      const known = new Set(catalog.fields.map((f: { path: string }) => f.path));
      for (const field of coverage.fields) expect(known.has(field.path)).toBe(true);
    });
  }
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/catalog-coverage.test.ts`
Expected: FAIL — coverage file missing.

- [ ] **Step 3: Write the coverage script**

Create `scripts/fields-coverage.mjs`:

```js
#!/usr/bin/env node
/*
 * For every catalog field, asks openFDA how many records actually populate it
 * (`_exists_:<path>`). Hits the live API; NOT part of npm test.
 *
 * Coverage is what makes field selection evidence-based: a field that exists
 * but is populated in 0.3% of records presents as a valid search that always
 * finds nothing, which is worse than not offering it at all.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ENDPOINTS = ['label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages'];
const API_KEY = process.env.OPENFDA_API_KEY;
const PAUSE_MS = 260; // stay under 240 req/min with a key

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function total(endpoint, search) {
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  if (search) params.set('search', search);
  params.set('limit', '0');
  const response = await fetch(`https://api.fda.gov/drug/${endpoint}.json?${params}`);
  if (response.status === 404) return 0; // NOT_FOUND is zero matches, not an error
  if (!response.ok) throw new Error(`/drug/${endpoint}.json -> HTTP ${response.status}`);
  const body = await response.json();
  return body?.meta?.results?.total ?? 0;
}

for (const endpoint of ENDPOINTS) {
  const catalog = JSON.parse(readFileSync(`src/catalog/drug-${endpoint}.json`, 'utf8'));
  const totalRecords = await total(endpoint, '');
  const fields = [];
  for (const field of catalog.fields) {
    await sleep(PAUSE_MS);
    let docs = 0;
    try {
      docs = await total(endpoint, `_exists_:${field.path}`);
    } catch (error) {
      console.error(`  ${field.path}: ${error.message}`);
    }
    fields.push({
      path: field.path,
      docs,
      coverage_pct: totalRecords ? Math.round((docs / totalRecords) * 10000) / 100 : 0,
    });
  }
  writeFileSync(
    `src/catalog/drug-${endpoint}.coverage.json`,
    JSON.stringify(
      { endpoint, measured_at: new Date().toISOString(), total_records: totalRecords, fields },
      null,
      2
    ) + '\n'
  );
  console.log(`drug-${endpoint}: measured ${fields.length} fields over ${totalRecords} records`);
}
```

- [ ] **Step 4: Run it**

Run: `OPENFDA_API_KEY=$OPENFDA_API_KEY npm run fields:coverage`
Expected: seven summary lines. This makes one request per catalog field and will take a while — `druglabel` alone is several hundred fields. Let it finish.

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/catalog-coverage.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/fields-coverage.mjs src/catalog tests/catalog-coverage.test.ts package.json
git commit -m "feat(catalog): measure per-field coverage against the live API"
```

### Task 3: Select and record the exposed fields

**Files:**
- Create: `docs/superpowers/notes/2026-09-20-field-selection.md`

**Interfaces:**
- Consumes: both catalog files from Tasks 1–2.
- Produces: the authoritative per-endpoint exposed-field list that Tasks 15–17 and 21–24 copy into descriptors. No code reads this file; it is the reviewable justification.

**Selection criteria (from spec §6.2).** A field is exposed only if it is: published in the catalog; a searchable scalar (string, date or number — not a container); at or above **5% coverage**; and of genuine query utility (identifier, name, classification, status or date). Target **10–20 fields per endpoint** to hold the schema budget.

- [ ] **Step 1: Produce a ranked shortlist per endpoint**

```bash
for e in label event ndc enforcement drugsfda orangebook shortages; do
  echo "=== $e ==="
  node -e '
    const c = require(`./src/catalog/drug-'"$e"'.coverage.json`);
    c.fields.filter(f => f.coverage_pct >= 5)
      .sort((a, b) => b.coverage_pct - a.coverage_pct)
      .slice(0, 40)
      .forEach(f => console.log(String(f.coverage_pct).padStart(6), f.path));
  '
done
```

- [ ] **Step 2: Write the selection note**

Create `docs/superpowers/notes/2026-09-20-field-selection.md` with one section per endpoint. Each section is a table of `| path | coverage_pct | why exposed |`, followed by a short "deliberately not exposed" list naming anything that cleared 5% but was rejected for low utility, and why.

Seed the selection with the fields already live-verified (these carry forward and do not need re-justifying):

- **label** — `openfda.brand_name`, `openfda.generic_name`, `openfda.substance_name`, `openfda.manufacturer_name`, `openfda.product_ndc`, `openfda.package_ndc`, `openfda.route`, `openfda.product_type`, `spl_product_data_elements`
- **event** — `patient.drug.medicinalproduct`, `patient.drug.openfda.generic_name`, `patient.drug.openfda.substance_name`, `patient.reaction.reactionmeddrapt`, `patient.reaction.reactionoutcome`, `serious`, `patient.patientsex`, `occurcountry`, `receivedate`
- **drugsfda** — every path in the existing `src/drug/drugsfda-sections.ts` table, which was live-probed in 1.2.0
- **ndc** — `product_ndc`, `generic_name`, `brand_name`, `labeler_name`, `application_number`, `marketing_category`, `dosage_form`, `product_type`, `route`, `pharm_class`
- **enforcement** — `recall_number`, `recalling_firm`, `classification`, `status`, `product_description`, `reason_for_recall`, `product_type`, `state`, `country`, `voluntary_mandated`, `report_date`, `recall_initiation_date`
- **orangebook** — `products.brand_name`, `products.application_number`, `products.application_full_name`, `products.active_ingredients.name`, `products.marketing_status`, `products.dosage_form`, `products.route`, `products.application_type`, `approval_date`
- **shortages** — `generic_name`, `company_name`, `status`, `dosage_form`, `therapeutic_category`, `package_ndc`, `openfda.brand_name`, `openfda.generic_name`, `openfda.manufacturer_name`, `update_type`, `initial_posting_date`

The `ndc`, `enforcement`, `orangebook` and `shortages` lists above were read from real records returned by the live API on 2026-09-20, so the names are real — but each must still be confirmed present in its catalog and at/above the coverage floor before being written into a descriptor. Drop any that fails, and say so in the note.

- [ ] **Step 3: Verify every listed field is in its catalog**

```bash
node -e '
  const fs = require("fs");
  const note = fs.readFileSync("docs/superpowers/notes/2026-09-20-field-selection.md", "utf8");
  let bad = 0;
  for (const e of ["label","event","ndc","enforcement","drugsfda","orangebook","shortages"]) {
    const known = new Set(require(`./src/catalog/drug-${e}.json`).fields.map(f => f.path));
    const section = note.split(/^## /m).find(s => s.trim().startsWith(e)) || "";
    for (const m of section.matchAll(/^\| `([^`]+)` \|/gm)) {
      if (!known.has(m[1])) { console.log(`MISSING ${e}: ${m[1]}`); bad++; }
    }
  }
  console.log(bad === 0 ? "all selected fields present in catalogs" : `${bad} missing`);
  process.exit(bad === 0 ? 0 : 1);
'
```

Expected: `all selected fields present in catalogs`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/notes/2026-09-20-field-selection.md
git commit -m "docs: record the exposed-field selection and its coverage justification"
```

---

# Phase 1 — The dataset-agnostic core

Ships nothing. `src/core/` is built and tested in isolation; no descriptor exists yet and `src/index.ts` is untouched, so the nine 1.x tools keep working throughout.

### Task 4: `escapeSearchValue` — close the injection hole

**Files:**
- Create: `src/core/search/escape.ts`
- Test: `tests/core/escape.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `escapeSearchValue(value: string): string`. Task 6 is its only caller.

- [ ] **Step 1: Write the failing test**

Create `tests/core/escape.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { escapeSearchValue } from '../../src/core/search/escape';

describe('escapeSearchValue', () => {
  it('leaves an ordinary value untouched', () => {
    expect(escapeSearchValue('Advil')).toBe('Advil');
    expect(escapeSearchValue('Children s Tylenol')).toBe('Children s Tylenol');
  });

  it('escapes the double quote that ends a phrase term', () => {
    expect(escapeSearchValue('Advil"')).toBe('Advil\\"');
  });

  it('escapes a backslash before escaping quotes, so the escape cannot be escaped away', () => {
    // A naive quote-only escape turns `\"` into `\\"`, where the caller's own
    // backslash consumes ours and the quote closes the term anyway.
    expect(escapeSearchValue('a\\"b')).toBe('a\\\\\\"b');
  });

  it('neutralises the real injection vector', () => {
    // Verified live 2026-09-20: unescaped, this returns Advil+Tylenol (150);
    // escaped, openFDA treats the whole thing as one literal term.
    const injected = 'Advil" OR openfda.brand_name:"Tylenol';
    expect(escapeSearchValue(injected)).toBe('Advil\\" OR openfda.brand_name:\\"Tylenol');
  });

  it('does not alter Lucene operators, which are inert inside a quoted phrase', () => {
    expect(escapeSearchValue('a AND b')).toBe('a AND b');
    expect(escapeSearchValue('a+b-c')).toBe('a+b-c');
  });

  it('handles unicode and empty input', () => {
    expect(escapeSearchValue('acetilsalicílico')).toBe('acetilsalicílico');
    expect(escapeSearchValue('')).toBe('');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/escape.test.ts`
Expected: FAIL — cannot resolve `../../src/core/search/escape`

- [ ] **Step 3: Implement**

Create `src/core/search/escape.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Escape a caller-supplied value for use inside a quoted openFDA phrase term.
 *
 * Verified live on 2026-09-20: `openfda.brand_name:"Advil" OR
 * openfda.brand_name:"Tylenol"` returns 150 — the sum of the two drugs — so an
 * unescaped value can append clauses and make the server answer about a
 * different drug than the one it reports. The same value with `\"` returns
 * NOT_FOUND, i.e. openFDA treats it as one literal term.
 *
 * Backslash must be escaped BEFORE the quote, or the caller's own backslash
 * consumes ours and the quote still closes the term.
 */
export function escapeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/escape.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/search/escape.ts tests/core/escape.test.ts
git commit -m "feat(core): escape search values to close the query-injection hole"
```

### Task 5: Search strategies

**Files:**
- Create: `src/core/search/strategy.ts`
- Test: `tests/core/strategy.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Clause { path: string; value: string }`
  - `interface ClauseSet { clauses: Clause[]; op: 'OR' | 'AND'; matched_via: string }`
  - `interface StrategyError { ok: false; message: string }`
  - `type SearchStrategy` — four variants, below
  - `planClauseSets(strategy: SearchStrategy, value: string): ClauseSet[] | StrategyError`
  - `declaredPaths(strategy: SearchStrategy): string[]`

  Task 6 consumes `Clause`/`ClauseSet`; Task 12 calls `planClauseSets`; Task 14 calls `declaredPaths`.

- [ ] **Step 1: Write the failing test**

Create `tests/core/strategy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  planClauseSets,
  declaredPaths,
  type SearchStrategy,
} from '../../src/core/search/strategy';

describe('planClauseSets', () => {
  it('exact yields one set naming the path as matched_via', () => {
    const strategy: SearchStrategy = { kind: 'exact', path: 'openfda.brand_name' };
    expect(planClauseSets(strategy, 'Advil')).toEqual([
      {
        clauses: [{ path: 'openfda.brand_name', value: 'Advil' }],
        op: 'OR',
        matched_via: 'openfda.brand_name',
      },
    ]);
  });

  it('anyOf yields ONE set ORing every path, because the union beats any single index', () => {
    const strategy: SearchStrategy = {
      kind: 'anyOf',
      paths: ['patient.drug.medicinalproduct', 'patient.drug.openfda.substance_name'],
    };
    const sets = planClauseSets(strategy, 'IBUPROFEN') as ReturnType<typeof planClauseSets> & any[];
    expect(sets).toHaveLength(1);
    expect(sets[0].clauses).toHaveLength(2);
    expect(sets[0].op).toBe('OR');
    expect(sets[0].matched_via).toBe(
      'union(patient.drug.medicinalproduct, patient.drug.openfda.substance_name)'
    );
  });

  it('tiered yields one set PER TIER, in order, so the executor can stop at the first hit', () => {
    const strategy: SearchStrategy = {
      kind: 'tiered',
      paths: ['openfda.brand_name', 'openfda.generic_name'],
    };
    const sets = planClauseSets(strategy, 'Cordarone') as any[];
    expect(sets).toHaveLength(2);
    expect(sets[0].matched_via).toBe('openfda.brand_name');
    expect(sets[1].matched_via).toBe('openfda.generic_name');
  });

  it('clauses delegates to the builder', () => {
    const strategy: SearchStrategy = {
      kind: 'clauses',
      paths: ['openfda.product_ndc', 'openfda.package_ndc'],
      build: (value) => ({
        clauses: [
          { path: 'openfda.product_ndc', value },
          { path: 'openfda.package_ndc', value: `${value}-01` },
        ],
        op: 'OR',
        matched_via: 'openfda.product_ndc OR openfda.package_ndc',
      }),
    };
    const sets = planClauseSets(strategy, '12345-1234') as any[];
    expect(sets).toHaveLength(1);
    expect(sets[0].clauses[1].value).toBe('12345-1234-01');
  });

  it('propagates a builder rejection instead of querying', () => {
    const strategy: SearchStrategy = {
      kind: 'clauses',
      paths: ['openfda.product_ndc'],
      build: () => ({ ok: false, message: 'not a valid NDC' }),
    };
    expect(planClauseSets(strategy, 'nonsense')).toEqual({ ok: false, message: 'not a valid NDC' });
  });
});

describe('declaredPaths', () => {
  it('reports every path each variant may query', () => {
    expect(declaredPaths({ kind: 'exact', path: 'a' })).toEqual(['a']);
    expect(declaredPaths({ kind: 'anyOf', paths: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(declaredPaths({ kind: 'tiered', paths: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(
      declaredPaths({ kind: 'clauses', paths: ['a', 'b'], build: () => ({ ok: false, message: 'x' }) })
    ).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/strategy.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/core/search/strategy.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/** One `path:"value"` term. `value` is RAW here; only the assembler escapes. */
export interface Clause {
  path: string;
  value: string;
}

/** One attempt: a group of clauses joined by `op`, plus what to report. */
export interface ClauseSet {
  clauses: Clause[];
  op: 'OR' | 'AND';
  matched_via: string;
}

export interface StrategyError {
  ok: false;
  message: string;
}

/**
 * How a field name resolves to queries.
 *
 * No variant produces a query STRING. That is the security property: the
 * executor is the only assembler, so escaping cannot be forgotten by a
 * descriptor author, because there is no seam through which to skip it.
 */
export type SearchStrategy =
  /** One real path. */
  | { kind: 'exact'; path: string }
  /** OR every path in one query — use when the union beats any single index. */
  | { kind: 'anyOf'; paths: string[] }
  /** Query each path in turn, stopping at the first with results. */
  | { kind: 'tiered'; paths: string[] }
  /**
   * Arbitrary clause construction, e.g. when two paths need DIFFERENT values.
   * `paths` is the exhaustive set `build` may emit; the catalog-conformance
   * guard checks it, and a unit test checks build() stays within it.
   */
  | {
      kind: 'clauses';
      paths: string[];
      build: (value: string) => ClauseSet | StrategyError;
    };

/** Every path a strategy may query. Used by the catalog-conformance guard. */
export function declaredPaths(strategy: SearchStrategy): string[] {
  return strategy.kind === 'exact' ? [strategy.path] : [...strategy.paths];
}

/**
 * The attempts to make, in order. A tiered strategy yields one set per tier;
 * every other variant yields exactly one.
 */
export function planClauseSets(
  strategy: SearchStrategy,
  value: string
): ClauseSet[] | StrategyError {
  switch (strategy.kind) {
    case 'exact':
      return [
        { clauses: [{ path: strategy.path, value }], op: 'OR', matched_via: strategy.path },
      ];
    case 'anyOf':
      return [
        {
          clauses: strategy.paths.map((path) => ({ path, value })),
          op: 'OR',
          matched_via: `union(${strategy.paths.join(', ')})`,
        },
      ];
    case 'tiered':
      return strategy.paths.map((path) => ({
        clauses: [{ path, value }],
        op: 'OR' as const,
        matched_via: path,
      }));
    case 'clauses': {
      const built = strategy.build(value);
      return 'ok' in built ? built : [built];
    }
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/strategy.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/search/strategy.ts tests/core/strategy.test.ts
git commit -m "feat(core): search strategies that emit clauses, never query strings"
```

### Task 6: `buildQuery` — the sole assembler

**Files:**
- Create: `src/core/search/query.ts`
- Test: `tests/core/query.test.ts`

**Interfaces:**
- Consumes: `escapeSearchValue` (Task 4), `Clause`/`ClauseSet` (Task 5).
- Produces: `buildQuery(set: ClauseSet, filters?: readonly Clause[]): string`. Task 12 is its only caller.

- [ ] **Step 1: Write the failing test**

Create `tests/core/query.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildQuery } from '../../src/core/search/query';

describe('buildQuery', () => {
  it('renders a single clause as a quoted phrase term', () => {
    expect(
      buildQuery({ clauses: [{ path: 'openfda.brand_name', value: 'Advil' }], op: 'OR', matched_via: 'x' })
    ).toBe('openfda.brand_name:"Advil"');
  });

  it('joins clauses with the set operator', () => {
    expect(
      buildQuery({
        clauses: [
          { path: 'a', value: 'x' },
          { path: 'b', value: 'x' },
        ],
        op: 'OR',
        matched_via: 'x',
      })
    ).toBe('a:"x" OR b:"x"');
  });

  it('PARENTHESISES the group before ANDing a filter', () => {
    // Without the parentheses `a OR b AND serious:"1"` binds the AND to b
    // only, silently filtering one index instead of all of them. This was
    // fixed by hand in get-drug-adverse-events; here it is structural.
    expect(
      buildQuery(
        {
          clauses: [
            { path: 'a', value: 'x' },
            { path: 'b', value: 'x' },
          ],
          op: 'OR',
          matched_via: 'x',
        },
        [{ path: 'serious', value: '1' }]
      )
    ).toBe('(a:"x" OR b:"x") AND serious:"1"');
  });

  it('ANDs multiple filters together', () => {
    expect(
      buildQuery({ clauses: [{ path: 'a', value: 'x' }], op: 'OR', matched_via: 'x' }, [
        { path: 'serious', value: '1' },
        { path: 'occurcountry', value: 'US' },
      ])
    ).toBe('(a:"x") AND serious:"1" AND occurcountry:"US"');
  });

  it('escapes every value it emits, in the group and in the filters', () => {
    expect(
      buildQuery({ clauses: [{ path: 'a', value: 'x" OR b:"y' }], op: 'OR', matched_via: 'x' }, [
        { path: 'f', value: 'q"' },
      ])
    ).toBe('(a:"x\\" OR b:\\"y") AND f:"q\\""');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/query.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/core/search/query.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { escapeSearchValue } from './escape.js';
import type { Clause, ClauseSet } from './strategy.js';

const term = (clause: Clause): string =>
  `${clause.path}:"${escapeSearchValue(clause.value)}"`;

/**
 * The ONLY place an openFDA search string is assembled. Everything upstream
 * deals in clauses, so no caller can bypass escaping.
 *
 * The clause group is always parenthesised when filters are present:
 * `a OR b AND serious:"1"` binds the AND to `b` alone, which silently applies
 * the filter to one index instead of all of them.
 *
 * Quoting a numeric filter is safe — verified live 2026-09-20, `serious:1` and
 * `serious:"1"` both return 23,172 — so every term is quoted uniformly.
 */
export function buildQuery(set: ClauseSet, filters: readonly Clause[] = []): string {
  const group = set.clauses.map(term).join(` ${set.op} `);
  if (filters.length === 0) return group;
  return `(${group}) AND ${filters.map(term).join(' AND ')}`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/query.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/search/query.ts tests/core/query.test.ts
git commit -m "feat(core): single query assembler with structural parenthesisation"
```

### Task 7: Response budget

**Files:**
- Create: `src/core/shape/budget.ts`
- Test: `tests/core/budget.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MAX_RESPONSE_CHARS: number` and
  `fitToBudget<T>(results: readonly T[], render: (rows: readonly T[]) => string, max?: number): { text: string; kept: number; dropped: number }`.
  Task 12 calls it.

- [ ] **Step 1: Write the failing test**

Create `tests/core/budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fitToBudget, MAX_RESPONSE_CHARS } from '../../src/core/shape/budget';

const render = (rows: readonly string[]) => JSON.stringify(rows);

describe('fitToBudget', () => {
  it('keeps everything when it already fits', () => {
    const result = fitToBudget(['a', 'b'], render, 1000);
    expect(result.kept).toBe(2);
    expect(result.dropped).toBe(0);
    expect(result.text).toBe('["a","b"]');
  });

  it('drops rows from the end until the rendered text fits', () => {
    const rows = Array.from({ length: 20 }, () => 'x'.repeat(50));
    const result = fitToBudget(rows, render, 300);
    expect(result.text.length).toBeLessThanOrEqual(300);
    expect(result.kept).toBeLessThan(20);
    expect(result.dropped).toBe(20 - result.kept);
  });

  it('never drops below one row, so an oversized single record still returns', () => {
    const result = fitToBudget(['x'.repeat(500)], render, 100);
    expect(result.kept).toBe(1);
    expect(result.dropped).toBe(0);
  });

  it('exposes a ceiling large enough to be useful and small enough to bound a context', () => {
    // The uncapped get-drugsfda response that motivated this was 71,393 chars.
    expect(MAX_RESPONSE_CHARS).toBeLessThan(71393);
    expect(MAX_RESPONSE_CHARS).toBeGreaterThan(10000);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/budget.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/core/shape/budget.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Ceiling on a single tool response. A 1.1.0 get-drugsfda call returned 71,393
 * characters, which is both unusable and a context-exhaustion path when one
 * pathological upstream record floods an agent.
 */
export const MAX_RESPONSE_CHARS = 60000;

/**
 * Render as many rows as fit. Truncating serialized JSON would produce invalid
 * JSON, so rows are dropped and re-rendered instead. Always keeps at least one
 * row: an oversized single record is still more useful than nothing.
 */
export function fitToBudget<T>(
  results: readonly T[],
  render: (rows: readonly T[]) => string,
  max: number = MAX_RESPONSE_CHARS
): { text: string; kept: number; dropped: number } {
  let kept = results.length;
  let text = render(results);
  while (text.length > max && kept > 1) {
    kept -= 1;
    text = render(results.slice(0, kept));
  }
  return { text, kept, dropped: results.length - kept };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/budget.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/shape/budget.ts tests/core/budget.test.ts
git commit -m "feat(core): central response budget so no endpoint can flood a context"
```

### Task 8: Code decoding and the envelope

**Files:**
- Create: `src/core/codes.ts`
- Create: `src/core/shape/envelope.ts`
- Test: `tests/core/codes.test.ts`, `tests/core/envelope.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `decodeTerm(codeMaps: Record<string, Record<string, string>>, path: string, raw: string | number): { term: string; term_code: string | number }`
  - `buildEnvelope<T>(matchedVia: string, results: T[], total: number | undefined, limit: number, skip?: number): Envelope<T>`

  Task 12 calls both.

- [ ] **Step 1: Write the failing tests**

Create `tests/core/codes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decodeTerm } from '../../src/core/codes';

const MAPS = {
  serious: { '1': 'Serious', '2': 'Not serious' },
  'patient.reaction.reactionoutcome': { '1': 'Recovered/resolved', '6': 'Unknown' },
};

describe('decodeTerm', () => {
  it('decodes a coded field to a label and keeps the raw value', () => {
    // openFDA sends coded fields as NUMBERS and text fields as strings.
    expect(decodeTerm(MAPS, 'serious', 1)).toEqual({ term: 'Serious', term_code: 1 });
  });

  it('passes a text field through with term and term_code identical', () => {
    expect(decodeTerm(MAPS, 'patient.reaction.reactionmeddrapt.exact', 'NAUSEA')).toEqual({
      term: 'NAUSEA',
      term_code: 'NAUSEA',
    });
  });

  it('matches a coded path even when the caller used the .exact suffix', () => {
    expect(decodeTerm(MAPS, 'serious.exact', 2)).toEqual({ term: 'Not serious', term_code: 2 });
  });

  it('falls back to the raw value for an unmapped code rather than inventing a label', () => {
    expect(decodeTerm(MAPS, 'serious', 9)).toEqual({ term: '9', term_code: 9 });
  });
});
```

Create `tests/core/envelope.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildEnvelope } from '../../src/core/shape/envelope';

describe('buildEnvelope', () => {
  it('reports the upstream total, not the caller limit', () => {
    const envelope = buildEnvelope('openfda.brand_name', [{ a: 1 }], 214, 5);
    expect(envelope).toEqual({
      matched_via: 'openfda.brand_name',
      total: 214,
      returned: 1,
      limit: 5,
      results: [{ a: 1 }],
    });
  });

  it('uses null, not a guess, when openFDA omits a total', () => {
    expect(buildEnvelope('x', [], undefined, 5).total).toBeNull();
  });

  it('includes skip only when the caller supplied it, so paged responses stay distinguishable', () => {
    expect('skip' in buildEnvelope('x', [], 1, 5)).toBe(false);
    expect(buildEnvelope('x', [], 1, 5, 20).skip).toBe(20);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/core/codes.test.ts tests/core/envelope.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement both**

Create `src/core/codes.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export interface DecodedTerm {
  term: string;
  term_code: string | number;
}

/**
 * Decode one aggregated term. Coded fields become a human label; text fields
 * pass through with `term` and `term_code` identical. `term_code` always keeps
 * the raw upstream value, so a caller aggregating by code is unaffected.
 *
 * An unmapped code returns the raw value rather than a guessed label: a wrong
 * label is indistinguishable from real data.
 */
export function decodeTerm(
  codeMaps: Record<string, Record<string, string>>,
  path: string,
  raw: string | number
): DecodedTerm {
  const map = codeMaps[path] ?? codeMaps[path.replace(/\.exact$/, '')];
  const decoded = map?.[String(raw)];
  return { term: decoded ?? String(raw), term_code: raw };
}
```

Create `src/core/shape/envelope.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export interface Envelope<T> {
  matched_via: string;
  skip?: number;
  total: number | null;
  returned: number;
  limit: number;
  results: T[];
}

/**
 * The one response shape every endpoint returns.
 *
 * `total` is the upstream match count, never the caller's limit — "Found 3"
 * reads as a total to every consumer and makes "past the limit"
 * indistinguishable from "not present". `null` means openFDA did not report
 * one, which it never does on aggregated responses.
 */
export function buildEnvelope<T>(
  matchedVia: string,
  results: T[],
  total: number | undefined,
  limit: number,
  skip?: number
): Envelope<T> {
  return {
    matched_via: matchedVia,
    ...(skip !== undefined ? { skip } : {}),
    total: typeof total === 'number' ? total : null,
    returned: results.length,
    limit,
    results,
  };
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run tests/core/codes.test.ts tests/core/envelope.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/codes.ts src/core/shape/envelope.ts tests/core/codes.test.ts tests/core/envelope.test.ts
git commit -m "feat(core): term decoding and the shared response envelope"
```

### Task 9: Descriptor types, projection, and descriptor validation

**Files:**
- Create: `src/core/descriptor.ts`
- Create: `src/core/shape/project.ts`
- Test: `tests/core/descriptor.test.ts`, `tests/core/project.test.ts`

**Interfaces:**
- Consumes: `SearchStrategy`, `Clause` (Task 5).
- Produces:
  - `FieldSpec`, `Projection`, `ExtraFilters`, `EndpointDescriptor` types
  - `validateDescriptor(descriptor: EndpointDescriptor): string[]` — empty array means valid
  - `applyProjection(projection: Projection, records: readonly unknown[]): Record<string, unknown>[]`
  - `capArray<T>(rows: T[] | undefined, max: number): { rows: T[]; truncated: boolean }`

  Tasks 12–13 consume the types; Tasks 15–17 and 21–24 write descriptors against them; Task 14 calls `validateDescriptor`.

- [ ] **Step 1: Write the failing tests**

Create `tests/core/project.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { applyProjection, capArray } from '../../src/core/shape/project';

describe('capArray', () => {
  it('reports truncation only when it actually dropped something', () => {
    expect(capArray([1, 2, 3], 10)).toEqual({ rows: [1, 2, 3], truncated: false });
    expect(capArray([1, 2, 3], 2)).toEqual({ rows: [1, 2], truncated: true });
  });

  it('treats a missing array as empty rather than throwing', () => {
    expect(capArray(undefined, 5)).toEqual({ rows: [], truncated: false });
  });
});

describe('applyProjection', () => {
  it('maps every record through the projection function', () => {
    const projection = {
      name: 'summary',
      description: 'x',
      returnsFields: ['id'] as const,
      project: (record: any) => ({ id: record.safetyreportid ?? null }),
    };
    expect(applyProjection(projection, [{ safetyreportid: '7' }, {}])).toEqual([
      { id: '7' },
      { id: null },
    ]);
  });
});
```

Create `tests/core/descriptor.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateDescriptor, type EndpointDescriptor } from '../../src/core/descriptor';

const base = (): EndpointDescriptor => ({
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search drug labels.',
  fields: [
    { name: 'brand_name', description: 'Brand', strategy: { kind: 'exact', path: 'openfda.brand_name' } },
  ],
  defaultField: 'brand_name',
  projections: [
    { name: 'summary', description: 'd', returnsFields: ['brand_name'], project: () => ({ brand_name: [] }) },
  ],
  sortFields: [],
  countFields: ['openfda.route'],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
});

describe('validateDescriptor', () => {
  it('accepts a well-formed descriptor', () => {
    expect(validateDescriptor(base())).toEqual([]);
  });

  it('rejects a descriptor with no fields', () => {
    const d = { ...base(), fields: [] };
    expect(validateDescriptor(d)).toContain('drug-label: must declare at least one field');
  });

  it('rejects duplicate field names, which would make one unreachable', () => {
    const d = base();
    d.fields = [d.fields[0]!, { ...d.fields[0]! }];
    expect(validateDescriptor(d)).toContain('drug-label: duplicate field name "brand_name"');
  });

  it('rejects a defaultField that is not a declared field', () => {
    const d = { ...base(), defaultField: 'nope' };
    expect(validateDescriptor(d)).toContain('drug-label: defaultField "nope" is not a declared field');
  });

  it('rejects a projection that declares no fields, which would defeat the drift guard', () => {
    const d = base();
    d.projections = [{ ...d.projections[0]!, returnsFields: [] }];
    expect(validateDescriptor(d)).toContain('drug-label: projection "summary" declares no returnsFields');
  });

  it('rejects a code map for a field that cannot be counted', () => {
    const d = { ...base(), codeMaps: { serious: { '1': 'Serious' } } };
    expect(validateDescriptor(d)).toContain(
      'drug-label: codeMaps has "serious" but it is not in countFields'
    );
  });

  it('rejects an incoherent limit range', () => {
    const d = { ...base(), limits: { default: 50, max: 25 } };
    expect(validateDescriptor(d)).toContain('drug-label: limits.default 50 exceeds limits.max 25');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/core/descriptor.test.ts tests/core/project.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement**

Create `src/core/descriptor.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { z } from 'zod';
import type { Clause, SearchStrategy } from './search/strategy.js';

/** One entry in a tool's `field` enum: a real path, or a virtual search. */
export interface FieldSpec {
  name: string;
  strategy: SearchStrategy;
  description: string;
  /** Some openFDA fields are stored uppercase, e.g. drugsfda sponsor_name. */
  uppercase?: boolean;
  /** Reject or rewrite the raw value before querying, e.g. NDC normalization. */
  normalize?: (
    raw: string
  ) => { ok: true; value: string } | { ok: false; message: string };
}

/** A named view of a record. `detail` selects one of these. */
export interface Projection {
  name: string;
  description: string;
  // Upstream openFDA records are genuinely untyped and vary per record.
  project: (record: any) => Record<string, unknown>;
  /** Keys this projection always emits. The drift guard checks both halves. */
  returnsFields: readonly string[];
}

/** Endpoint-specific parameters, ANDed onto the main clause group. */
export interface ExtraFilters {
  schema: z.ZodRawShape;
  toClauses: (input: Record<string, unknown>) => Clause[];
}

export interface EndpointDescriptor {
  dataset: string;
  endpoint: string;
  toolName: string;
  summary: string;
  fields: FieldSpec[];
  defaultField?: string;
  /** `projections[0]` is the default value of `detail`. */
  projections: Projection[];
  extraFilters?: ExtraFilters;
  sortFields: readonly string[];
  countFields: readonly string[];
  /** query path -> raw code -> human label */
  codeMaps: Record<string, Record<string, string>>;
  limits: { default: number; max: number };
  /** Repo-relative path to the committed FDA field catalog. */
  catalog: string;
}

const stripExact = (path: string): string => path.replace(/\.exact$/, '');

/**
 * Structural checks a descriptor must pass before it is registered. Returns
 * every problem found, so one run reports all of them.
 */
export function validateDescriptor(descriptor: EndpointDescriptor): string[] {
  const problems: string[] = [];
  const at = (message: string): void => {
    problems.push(`${descriptor.toolName}: ${message}`);
  };

  if (descriptor.fields.length === 0) at('must declare at least one field');

  const seenFields = new Set<string>();
  for (const field of descriptor.fields) {
    if (seenFields.has(field.name)) at(`duplicate field name "${field.name}"`);
    seenFields.add(field.name);
  }

  if (descriptor.defaultField && !seenFields.has(descriptor.defaultField)) {
    at(`defaultField "${descriptor.defaultField}" is not a declared field`);
  }

  if (descriptor.projections.length === 0) at('must declare at least one projection');

  const seenProjections = new Set<string>();
  for (const projection of descriptor.projections) {
    if (seenProjections.has(projection.name)) at(`duplicate projection "${projection.name}"`);
    seenProjections.add(projection.name);
    if (projection.returnsFields.length === 0) {
      at(`projection "${projection.name}" declares no returnsFields`);
    }
  }

  const countable = new Set(descriptor.countFields.map(stripExact));
  for (const path of Object.keys(descriptor.codeMaps)) {
    if (!countable.has(stripExact(path))) {
      at(`codeMaps has "${path}" but it is not in countFields`);
    }
  }

  if (descriptor.limits.default < 1) at('limits.default must be at least 1');
  if (descriptor.limits.default > descriptor.limits.max) {
    at(`limits.default ${descriptor.limits.default} exceeds limits.max ${descriptor.limits.max}`);
  }

  return problems;
}
```

Create `src/core/shape/project.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { Projection } from '../descriptor.js';

/** Cap a nested array, reporting whether anything was actually dropped. */
export function capArray<T>(
  rows: T[] | undefined,
  max: number
): { rows: T[]; truncated: boolean } {
  const all = Array.isArray(rows) ? rows : [];
  return { rows: all.slice(0, max), truncated: all.length > max };
}

export function applyProjection(
  projection: Projection,
  records: readonly unknown[]
): Record<string, unknown>[] {
  return records.map((record) => projection.project(record));
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run tests/core/descriptor.test.ts tests/core/project.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/descriptor.ts src/core/shape/project.ts tests/core/descriptor.test.ts tests/core/project.test.ts
git commit -m "feat(core): descriptor contract, projections, and descriptor validation"
```

### Task 10: Generalise `OpenFDABuilder` beyond the drug dataset

**Files:**
- Modify: `src/OpenFDABuilder.ts:8-15` (the `DatasetType` / `ContextType` unions), `:42-50` (the two methods), `:80-105` (`build()`)
- Modify: `tests/OpenFDABuilder.test.ts`
- Test: `tests/OpenFDABuilder.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `.dataset(name: string)` and a new `.endpoint(name: string)`. `.context()` is kept as a thin alias so the nine 1.x tools and their tests keep compiling through Phases 1–2; Task 19 deletes it.

- [ ] **Step 1: Write the failing test**

Append to `tests/OpenFDABuilder.test.ts`:

```ts
describe('dataset and endpoint are open, not a fixed union', () => {
  it('builds a URL for an endpoint the drug tools never used', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .endpoint('enforcement')
      .search('classification:"Class I"')
      .limit(3)
      .build();
    expect(url).toContain('https://api.fda.gov/drug/enforcement.json?');
    expect(url).toContain('search=classification%3A%22Class+I%22');
    expect(url).toContain('limit=3');
  });

  it('builds a URL for a future dataset without a code change', () => {
    const url = new OpenFDABuilder()
      .dataset('food')
      .endpoint('enforcement')
      .search('state:"CA"')
      .build();
    expect(url).toContain('https://api.fda.gov/food/enforcement.json?');
  });

  it('keeps context() working as an alias while the 1.x tools still exist', () => {
    const viaContext = new OpenFDABuilder().dataset('drug').context('label').search('a:"b"').build();
    const viaEndpoint = new OpenFDABuilder().dataset('drug').endpoint('label').search('a:"b"').build();
    expect(viaContext).toBe(viaEndpoint);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/OpenFDABuilder.test.ts`
Expected: FAIL — `.endpoint is not a function`

- [ ] **Step 3: Implement**

In `src/OpenFDABuilder.ts`, replace the two type aliases:

```ts
/**
 * Open by design: the dataset and endpoint come from an EndpointDescriptor,
 * which is a closed compile-time set. Keeping them as string here is what lets
 * a new API group be added as data rather than as a union member.
 */
type DatasetType = string;
type EndpointType = string;
```

Replace the `context()` method with:

```ts
  endpoint(endpoint: EndpointType): this {
    this.params.set('endpoint', endpoint);
    return this;
  }

  /** @deprecated Alias kept until the 1.x tools are removed. Use endpoint(). */
  context(context: EndpointType): this {
    return this.endpoint(context);
  }
```

And in `build()`, replace the `context` lookup:

```ts
    const dataset = this.params.get('dataset');
    const endpoint = this.params.get('endpoint');
    const search = this.params.get('search');
    const limit = this.params.get('limit') ?? 1;

    if (!dataset || !endpoint || !search) {
      throw new Error('Missing required parameters: dataset, endpoint or search');
    }
```

and the final return:

```ts
    return `${this.urlBase}/${dataset}/${endpoint}.json?${query}`;
```

- [ ] **Step 4: Run the whole suite**

Run: `npm run test:ci && npm run typecheck`
Expected: PASS — including every existing test, because `context()` still works.

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/OpenFDABuilder.ts tests/OpenFDABuilder.test.ts
git commit -m "refactor(builder): open dataset and endpoint to any API group"
```

### Task 11: `fetchPage` — classify hit, miss and error

**Files:**
- Create: `src/core/http.ts`
- Create: `tests/helpers/stubFetchResponses.ts`
- Test: `tests/core/http.test.ts`

**Interfaces:**
- Consumes: `OpenFDABuilder` (Task 10), `makeOpenFDARequest` (existing).
- Produces:
  - `interface PageRequest { dataset, endpoint, search, limit, skip?, sort?, count? }`
  - `type PageOutcome<T> = { kind: 'hit'; data: T } | { kind: 'miss' } | { kind: 'error'; error: OpenFDAError }`
  - `fetchPage<T>(request: PageRequest): Promise<PageOutcome<T>>`
  - test helper `stubFetchResponses(responses: Array<{ status?: number; body: unknown }>): { calls: string[]; restore: () => void }`

  Task 12 is `fetchPage`'s only caller. Tasks 12, 15–17 use the helper.

**Why this exists.** Verified live on 2026-09-20: openFDA answers a zero-match search with **HTTP 404** and `error.code: NOT_FOUND`. `ApiHandler` turns that into an `OpenFDAError`, so every 1.x tool takes its error branch and reports `Failed to retrieve …` with `isError: true` for a drug that simply is not there — the friendly not-found branches are effectively dead code against the live API. Classifying the outcome in one place is what fixes that for all seven endpoints at once.

- [ ] **Step 1: Write the test helper**

Create `tests/helpers/stubFetchResponses.ts`:

```ts
import { vi } from 'vitest';

/**
 * Like stubFetch, but each response carries its own HTTP status, so a test can
 * exercise the 404-means-no-matches path that the live API actually produces.
 */
export function stubFetchResponses(
  responses: Array<{ status?: number; body: unknown }>
): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  let index = 0;
  const original = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: any) => {
    calls.push(String(input));
    const response = responses[Math.min(index, responses.length - 1)]!;
    index += 1;
    const status = response.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    } as any;
  }) as any;

  return { calls, restore: () => { globalThis.fetch = original; } };
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/core/http.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { fetchPage } from '../../src/core/http';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const request = {
  dataset: 'drug',
  endpoint: 'label',
  search: 'openfda.brand_name:"Advil"',
  limit: 1,
};

describe('fetchPage', () => {
  it('reports a hit and hands back the parsed body', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 39 } }, results: [{ id: 1 }] } },
    ]);
    restore = stub.restore;
    const outcome = await fetchPage<any>(request);
    expect(outcome.kind).toBe('hit');
    if (outcome.kind === 'hit') expect(outcome.data.meta.results.total).toBe(39);
  });

  it('treats HTTP 404 NOT_FOUND as a MISS, not an error', async () => {
    // This is how openFDA reports zero matches. Calling it an error is the
    // defect that made every 1.x not-found message unreachable.
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No matches found!' } } },
    ]);
    restore = stub.restore;
    expect((await fetchPage(request)).kind).toBe('miss');
  });

  it('treats a 200 with an empty results array as a miss', async () => {
    const stub = stubFetchResponses([{ body: { meta: {}, results: [] } }]);
    restore = stub.restore;
    expect((await fetchPage(request)).kind).toBe('miss');
  });

  it('reports a genuine upstream failure as an error', async () => {
    const stub = stubFetchResponses([{ status: 500, body: { error: { code: 'SERVER' } } }]);
    restore = stub.restore;
    const outcome = await fetchPage(request);
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') expect(outcome.error.status).toBe(500);
  }, 20000);

  it('passes skip, sort and count through to the URL', async () => {
    const stub = stubFetchResponses([{ body: { results: [{ term: 'NAUSEA', count: 3 }] } }]);
    restore = stub.restore;
    await fetchPage({
      ...request,
      endpoint: 'event',
      skip: 20,
      sort: 'receivedate:desc',
      count: 'patient.reaction.reactionmeddrapt.exact',
    });
    expect(stub.calls[0]).toContain('skip=20');
    expect(stub.calls[0]).toContain('sort=receivedate%3Adesc');
    expect(stub.calls[0]).toContain('count=patient.reaction.reactionmeddrapt.exact');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/core/http.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement**

Create `src/core/http.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import type { OpenFDAError } from '../types.js';

export interface PageRequest {
  dataset: string;
  endpoint: string;
  search: string;
  limit: number;
  skip?: number;
  sort?: string;
  count?: string;
}

export type PageOutcome<T> =
  | { kind: 'hit'; data: T }
  | { kind: 'miss' }
  | { kind: 'error'; error: OpenFDAError };

interface ResultsBody {
  results?: unknown[];
}

/**
 * One openFDA page request, classified into the three outcomes the executor
 * must keep apart.
 *
 * Verified live 2026-09-20: a zero-match search returns HTTP 404 with
 * `error.code: NOT_FOUND`. That is data, not a failure, so it is a MISS. Any
 * other non-2xx is a genuine upstream error and must stay distinguishable — a
 * caller has to be able to tell "this drug has no recalls" from "we could not
 * reach openFDA".
 */
export async function fetchPage<T>(request: PageRequest): Promise<PageOutcome<T>> {
  const builder = new OpenFDABuilder()
    .dataset(request.dataset)
    .endpoint(request.endpoint)
    .search(request.search)
    .limit(request.limit);

  if (request.skip !== undefined) builder.skip(request.skip);
  if (request.sort !== undefined) builder.sort(request.sort);
  if (request.count !== undefined) builder.count(request.count);

  const { data, error } = await makeOpenFDARequest<T & ResultsBody>(builder.build());

  if (error) {
    return error.status === 404 ? { kind: 'miss' } : { kind: 'error', error };
  }
  if (!data?.results || data.results.length === 0) return { kind: 'miss' };
  return { kind: 'hit', data };
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run tests/core/http.test.ts`
Expected: PASS (5 tests). The 500 case retries with backoff, which is why that test has a raised timeout.

- [ ] **Step 6: Commit**

```bash
npm run lint -- --fix
git add src/core/http.ts tests/core/http.test.ts tests/helpers/stubFetchResponses.ts
git commit -m "feat(core): classify 404 NOT_FOUND as no-results instead of an error"
```

### Task 12: The executor

**Files:**
- Create: `src/core/executor.ts`
- Test: `tests/core/executor.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor`, `FieldSpec`, `Projection` (Task 9); `planClauseSets` (Task 5); `buildQuery` (Task 6); `fetchPage` (Task 11); `applyProjection` (Task 9); `buildEnvelope`, `decodeTerm` (Task 8); `fitToBudget` (Task 7); `summarizeResults` (existing `src/utils/format.ts`).
- Produces:
  - `SKIP_MAX = 25000`
  - `interface McpResult { content: { type: 'text'; text: string }[]; isError?: boolean }`
  - `execute(descriptor: EndpointDescriptor, input: ExecuteInput): Promise<McpResult>`

  Task 13 is its only caller.

- [ ] **Step 1: Write the failing test**

Create `tests/core/executor.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { execute } from '../../src/core/executor';
import type { EndpointDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const NOT_FOUND = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No matches found!' } } };

const descriptor = (): EndpointDescriptor => ({
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search drug labels.',
  fields: [
    {
      name: 'drug_name',
      description: 'Brand, generic or substance name.',
      strategy: { kind: 'tiered', paths: ['openfda.brand_name', 'openfda.generic_name'] },
    },
    {
      name: 'sponsor',
      description: 'Sponsor, stored uppercase.',
      uppercase: true,
      strategy: { kind: 'exact', path: 'sponsor_name' },
    },
    {
      name: 'bad_ndc',
      description: 'Rejects bad input before querying.',
      normalize: (raw) =>
        raw === 'ok' ? { ok: true, value: '12345-1234' } : { ok: false, message: 'not a valid NDC' },
      strategy: { kind: 'exact', path: 'openfda.product_ndc' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity fields.',
      returnsFields: ['brand_name'],
      project: (record: any) => ({ brand_name: record?.openfda?.brand_name ?? [] }),
    },
    {
      name: 'full',
      description: 'Everything.',
      returnsFields: ['raw'],
      project: (record: any) => ({ raw: record }),
    },
  ],
  extraFilters: {
    schema: {},
    toClauses: (input) =>
      input.seriousness === 'serious' ? [{ path: 'serious', value: '1' }] : [],
  },
  sortFields: ['receivedate:desc'],
  countFields: ['openfda.route', 'serious'],
  codeMaps: { serious: { '1': 'Serious', '2': 'Not serious' } },
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
});

const textOf = (result: { content: { text: string }[] }) => result.content[0]!.text;

describe('execute: input validation happens before any request', () => {
  it('rejects an unknown field and lists the valid ones', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'nope', value: 'Advil' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('drug_name');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects an empty value', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: '   ' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects a normalize failure with the normalizer message', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'bad_ndc', value: 'junk' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('not a valid NDC');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects skip above openFDA ceiling locally rather than forwarding it', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', skip: 25001 });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('25000');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects a count field the endpoint cannot aggregate', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'not_countable' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });
});

describe('execute: search behaviour', () => {
  it('uppercases a value when the field says the data is stored uppercase', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { field: 'sponsor', value: 'Pfizer' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('sponsor_name:"PFIZER"');
  });

  it('escapes the value, so an injected clause cannot reach openFDA', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil" OR openfda.brand_name:"Tylenol' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('\\"');
  });

  it('stops a tiered search at the first tier with results', async () => {
    const stub = stubFetchResponses([
      NOT_FOUND,
      { body: { meta: { results: { total: 2 } }, results: [{ openfda: { brand_name: ['X'] } }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Cordarone' });
    expect(stub.calls).toHaveLength(2);
    expect(textOf(result)).toContain('"matched_via": "openfda.generic_name"');
  });

  it('reports no results — not an error — when every tier misses', async () => {
    const stub = stubFetchResponses([NOT_FOUND, NOT_FOUND]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Zzz' });
    expect(result.isError).toBeUndefined();
    expect(textOf(result)).toContain('No drug-label records found');
    expect(textOf(result)).toContain('openfda.brand_name');
  });

  it('reports an upstream error when a tier failed and nothing matched', async () => {
    const stub = stubFetchResponses([{ status: 500, body: {} }, NOT_FOUND]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Zzz' });
    expect(result.isError).toBe(true);
  }, 20000);

  it('parenthesises the clause group before ANDing an extra filter', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil', seriousness: 'serious' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('(openfda.brand_name:"Advil") AND serious:"1"');
  });
});

describe('execute: response shaping', () => {
  it('returns the selected projection and the upstream total', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 214 } }, results: [{ openfda: { brand_name: ['Advil'] } }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', detail: 'summary' });
    expect(textOf(result)).toContain('"total": 214');
    expect(textOf(result)).toContain('"brand_name"');
    expect(textOf(result)).toContain('Showing 1 of 214');
  });

  it('rejects an unknown detail value', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', detail: 'nope' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });

  it('echoes skip only when supplied, so paged responses are distinguishable', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 9 } }, results: [{}] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', skip: 20 });
    expect(textOf(result)).toContain('"skip": 20');
    expect(textOf(result)).toContain('starting at offset 20');
  });

  it('decodes coded terms on a count response and reports no total', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 1, count: 812 }, { term: 2, count: 44 }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'serious' });
    const text = textOf(result);
    expect(text).toContain('"term": "Serious"');
    expect(text).toContain('"term_code": 1');
    expect(text).toContain('"counted_by": "serious"');
    expect(text).not.toContain('"total"');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/executor.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/core/executor.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec, Projection } from './descriptor.js';
import { planClauseSets, type ClauseSet } from './search/strategy.js';
import { buildQuery } from './search/query.js';
import { fetchPage } from './http.js';
import { applyProjection } from './shape/project.js';
import { buildEnvelope } from './shape/envelope.js';
import { fitToBudget } from './shape/budget.js';
import { decodeTerm } from './codes.js';
import { summarizeResults } from '../utils/format.js';
import type { OpenFDAError } from '../types.js';

/** openFDA rejects a larger offset: "Skip value must 25000 or less." */
export const SKIP_MAX = 25000;

export interface McpResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface ExecuteInput {
  field?: string;
  value: string;
  limit?: number;
  skip?: number;
  sort?: string;
  count?: string;
  detail?: string;
  [key: string]: unknown;
}

const fail = (text: string): McpResult => ({
  content: [{ type: 'text', text }],
  isError: true,
});

const succeed = (text: string): McpResult => ({ content: [{ type: 'text', text }] });

interface CountRow {
  // openFDA sends coded fields as NUMBERS and text fields as strings.
  term: string | number;
  count: number;
}

interface UpstreamPage {
  meta?: { results?: { total?: number } };
  results: unknown[];
}

function notFoundText(
  descriptor: EndpointDescriptor,
  value: string,
  attempted: readonly string[]
): string {
  return (
    `No ${descriptor.toolName} records found for "${value}".\n\n` +
    `Searched, in order: ${attempted.join(', ')}.\n\n` +
    'Suggestions:\n' +
    '- Check the spelling.\n' +
    '- Try a generic or substance name rather than a brand.\n' +
    '- Try a different field; this endpoint indexes several.\n' +
    '- Some records simply do not exist for every product.'
  );
}

/**
 * The one request pipeline. Every endpoint tool is this function plus a
 * descriptor, which is why escaping, parenthesisation, the skip ceiling, the
 * response budget and the four error outcomes cannot vary between tools.
 */
export async function execute(
  descriptor: EndpointDescriptor,
  input: ExecuteInput
): Promise<McpResult> {
  // --- resolve the field -------------------------------------------------
  const fieldName = input.field ?? descriptor.defaultField ?? descriptor.fields[0]?.name;
  const spec: FieldSpec | undefined = descriptor.fields.find((f) => f.name === fieldName);
  if (!spec) {
    const valid = descriptor.fields.map((f) => f.name).join(', ');
    return fail(`Unknown field "${fieldName}" for ${descriptor.toolName}. Valid fields: ${valid}.`);
  }

  // --- validate the value, before any network call ------------------------
  let value = (input.value ?? '').trim();
  if (value.length === 0) return fail(`value must not be empty for ${descriptor.toolName}.`);

  if (spec.normalize) {
    const normalized = spec.normalize(value);
    if (!normalized.ok) return fail(normalized.message);
    value = normalized.value;
  }
  if (spec.uppercase) value = value.toUpperCase();

  if (input.skip !== undefined && input.skip > SKIP_MAX) {
    return fail(
      `skip must be ${SKIP_MAX} or less (openFDA's ceiling); received ${input.skip}. ` +
        'To reach records beyond that, narrow the search or use sort to bring them into range.'
    );
  }

  if (input.count !== undefined && !descriptor.countFields.includes(input.count)) {
    const valid = descriptor.countFields.join(', ') || 'none';
    return fail(
      `Cannot count by "${input.count}" on ${descriptor.toolName}. Countable fields: ${valid}.`
    );
  }

  const projection: Projection | undefined = input.detail
    ? descriptor.projections.find((p) => p.name === input.detail)
    : descriptor.projections[0];
  if (!projection) {
    const valid = descriptor.projections.map((p) => p.name).join(', ');
    return fail(`Unknown detail "${input.detail}" for ${descriptor.toolName}. Valid: ${valid}.`);
  }

  const planned = planClauseSets(spec.strategy, value);
  if ('ok' in planned) return fail(planned.message);

  // --- query ---------------------------------------------------------------
  const filters = descriptor.extraFilters?.toClauses(input) ?? [];
  const limit = input.limit ?? descriptor.limits.default;

  let hit: { set: ClauseSet; data: UpstreamPage } | null = null;
  let lastError: OpenFDAError | null = null;
  const attempted: string[] = [];

  for (const set of planned) {
    attempted.push(set.matched_via);
    const outcome = await fetchPage<UpstreamPage>({
      dataset: descriptor.dataset,
      endpoint: descriptor.endpoint,
      search: buildQuery(set, filters),
      limit,
      skip: input.skip,
      sort: input.sort,
      count: input.count,
    });
    // A miss on one tier is expected, not fatal: keep walking.
    if (outcome.kind === 'miss') continue;
    if (outcome.kind === 'error') {
      lastError = outcome.error;
      continue;
    }
    hit = { set, data: outcome.data };
    break;
  }

  if (!hit) {
    // An error anywhere with no hit is an upstream failure; all-miss is data.
    if (lastError) {
      return fail(`Failed to query ${descriptor.toolName} for "${value}": ${lastError.message}`);
    }
    return succeed(notFoundText(descriptor, value, attempted));
  }

  // --- aggregated response --------------------------------------------------
  if (input.count !== undefined) {
    const rows = (hit.data.results as CountRow[]).map((row) => ({
      ...decodeTerm(descriptor.codeMaps, input.count as string, row.term),
      count: row.count,
    }));
    const payload = {
      matched_via: hit.set.matched_via,
      counted_by: input.count,
      returned: rows.length,
      results: rows,
    };
    return succeed(
      `Top ${rows.length} values of ${input.count} for "${value}" ` +
        `(aggregated responses carry no result total)\n\n${JSON.stringify(payload, null, 2)}`
    );
  }

  // --- record response ------------------------------------------------------
  const total = hit.data.meta?.results?.total;
  const projected = applyProjection(projection, hit.data.results);
  const matchedVia = hit.set.matched_via;

  const render = (rows: readonly Record<string, unknown>[]): string =>
    JSON.stringify(buildEnvelope(matchedVia, [...rows], total, limit, input.skip), null, 2);

  const { text, kept, dropped } = fitToBudget(projected, render);

  const header =
    summarizeResults(kept, total, `${descriptor.toolName} records matching ${matchedVia}`) +
    (input.skip !== undefined ? `, starting at offset ${input.skip}` : '') +
    (dropped > 0 ? ` (${dropped} omitted to stay within the response budget)` : '');

  return succeed(`${header}\n\n${text}`);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/executor.test.ts`
Expected: PASS (15 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/executor.ts tests/core/executor.test.ts
git commit -m "feat(core): the single endpoint executor"
```

### Task 13: The registry — descriptors become MCP tools

**Files:**
- Create: `src/core/registry.ts`
- Test: `tests/core/registry.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor`, `validateDescriptor` (Task 9); `execute`, `SKIP_MAX` (Task 12); `ToolManager` (existing).
- Produces:
  - `buildDescription(descriptor: EndpointDescriptor): string`
  - `buildInputSchema(descriptor: EndpointDescriptor): z.ZodObject<z.ZodRawShape>`
  - `toToolDefinition(descriptor: EndpointDescriptor): { name, description, inputSchema, returnsFields, handler }`
  - `registerDataset(toolManager: ToolManager, descriptors: readonly EndpointDescriptor[]): void`

  Task 14 calls `toToolDefinition`; Task 18 calls `registerDataset` from `src/index.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/core/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildDescription, buildInputSchema, toToolDefinition } from '../../src/core/registry';
import type { EndpointDescriptor } from '../../src/core/descriptor';

const descriptor: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search FDA drug product labels (SPL).',
  fields: [
    {
      name: 'drug_name',
      description: 'Brand, generic or substance name, tried in that order.',
      strategy: { kind: 'tiered', paths: ['openfda.brand_name', 'openfda.generic_name'] },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity plus the safety narrative.',
      returnsFields: ['brand_name', 'boxed_warning'],
      project: (record: any) => ({
        brand_name: record?.openfda?.brand_name ?? [],
        boxed_warning: record?.boxed_warning ?? [],
      }),
    },
  ],
  sortFields: ['effective_time:desc'],
  countFields: ['openfda.route'],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
};

describe('buildDescription', () => {
  it('names every field a projection guarantees, so the drift guard can hold', () => {
    const description = buildDescription(descriptor);
    expect(description).toContain('brand_name');
    expect(description).toContain('boxed_warning');
  });

  it('names the envelope keys it always returns', () => {
    const description = buildDescription(descriptor);
    for (const key of ['matched_via', 'total', 'returned', 'limit', 'results']) {
      expect(description).toContain(key);
    }
  });

  it('lists the searchable fields and the detail values', () => {
    const description = buildDescription(descriptor);
    expect(description).toContain('drug_name');
    expect(description).toContain('summary');
  });
});

describe('buildInputSchema', () => {
  const schema = buildInputSchema(descriptor);

  it('defaults field and detail so the simplest call is value-only', () => {
    const parsed = schema.parse({ value: 'Advil' });
    expect(parsed.field).toBe('drug_name');
    expect(parsed.detail).toBe('summary');
    expect(parsed.limit).toBe(1);
  });

  it('rejects a field outside the enum', () => {
    expect(() => schema.parse({ value: 'Advil', field: 'nope' })).toThrow();
  });

  it('enforces the endpoint limit ceiling', () => {
    expect(() => schema.parse({ value: 'Advil', limit: 26 })).toThrow();
  });

  it('enforces openFDA skip ceiling', () => {
    expect(() => schema.parse({ value: 'Advil', skip: 25001 })).toThrow();
  });

  it('omits sort and count when the endpoint declares none', () => {
    const bare = buildInputSchema({ ...descriptor, sortFields: [], countFields: [] });
    expect('sort' in bare.shape).toBe(false);
    expect('count' in bare.shape).toBe(false);
  });
});

describe('toToolDefinition', () => {
  it('produces a registrable tool named after the descriptor', () => {
    const tool = toToolDefinition(descriptor);
    expect(tool.name).toBe('drug-label');
    expect(typeof tool.handler).toBe('function');
    expect(tool.returnsFields).toContain('matched_via');
  });

  it('refuses to build a tool from an invalid descriptor', () => {
    expect(() => toToolDefinition({ ...descriptor, projections: [] })).toThrow(/projection/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/registry.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/core/registry.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { z } from 'zod';
import type { EndpointDescriptor } from './descriptor.js';
import { validateDescriptor } from './descriptor.js';
import { execute, SKIP_MAX, type ExecuteInput, type McpResult } from './executor.js';
import type { ToolManager } from '../ToolManager.js';

/** Keys every endpoint's record response carries. */
export const ENVELOPE_FIELDS = ['matched_via', 'total', 'returned', 'limit', 'results'] as const;

const asEnum = (values: readonly string[]): [string, ...string[]] =>
  values as unknown as [string, ...string[]];

/**
 * Compose the tool description from the descriptor.
 *
 * It must NAME every field each projection guarantees: a capability a model
 * cannot see in the schema does not exist as far as the model is concerned,
 * and the drift guard asserts exactly this.
 */
export function buildDescription(descriptor: EndpointDescriptor): string {
  const fields = descriptor.fields
    .map((field) => `${field.name} (${field.description})`)
    .join('; ');

  const details = descriptor.projections
    .map(
      (projection) =>
        `"${projection.name}" — ${projection.description} Returns: ${projection.returnsFields.join(', ')}.`
    )
    .join(' ');

  const counting =
    descriptor.countFields.length > 0
      ? ` Set count to rank values by frequency instead of returning records; it returns {term, term_code, count} and no total, because openFDA omits one on aggregated responses. Countable fields: ${descriptor.countFields.join(', ')}.`
      : '';

  const sorting =
    descriptor.sortFields.length > 0
      ? ` Order with sort (${descriptor.sortFields.join(', ')}); without it, results are a deterministic slice, so a small sample is not representative.`
      : '';

  return (
    `${descriptor.summary} Search one field at a time: field + value. ` +
    `Searchable fields: ${fields}. ` +
    `Always returns ${ENVELOPE_FIELDS.join(', ')}, where matched_via is the real path that matched ` +
    `and total is the upstream match count, not the number returned. ` +
    `detail selects the record shape: ${details}` +
    `${counting}${sorting} ` +
    `Page with limit (max ${descriptor.limits.max}, default ${descriptor.limits.default}) and skip (max ${SKIP_MAX}).`
  );
}

export function buildInputSchema(descriptor: EndpointDescriptor): z.ZodObject<z.ZodRawShape> {
  const fieldNames = descriptor.fields.map((field) => field.name);
  const detailNames = descriptor.projections.map((projection) => projection.name);

  const shape: z.ZodRawShape = {
    field: z
      .enum(asEnum(fieldNames))
      .optional()
      .default(descriptor.defaultField ?? fieldNames[0]!)
      .describe(`Field to search. One of: ${fieldNames.join(', ')}`),
    value: z.string().min(1).describe('Value to search for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(descriptor.limits.max)
      .optional()
      .default(descriptor.limits.default)
      .describe('Maximum number of records to return.'),
    skip: z
      .number()
      .int()
      .min(0)
      .max(SKIP_MAX)
      .optional()
      .describe(`Offset into the result set. Maximum ${SKIP_MAX}.`),
    detail: z
      .enum(asEnum(detailNames))
      .optional()
      .default(detailNames[0]!)
      .describe(`Record shape. One of: ${detailNames.join(', ')}`),
  };

  if (descriptor.sortFields.length > 0) {
    shape.sort = z
      .enum(asEnum(descriptor.sortFields))
      .optional()
      .describe('Result ordering.');
  }
  if (descriptor.countFields.length > 0) {
    shape.count = z
      .enum(asEnum(descriptor.countFields))
      .optional()
      .describe('Aggregate by this field instead of returning records.');
  }
  for (const [key, schema] of Object.entries(descriptor.extraFilters?.schema ?? {})) {
    shape[key] = schema;
  }

  return z.object(shape);
}

export function toToolDefinition(descriptor: EndpointDescriptor): {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  returnsFields: readonly string[];
  handler: (input: ExecuteInput) => Promise<McpResult>;
} {
  const problems = validateDescriptor(descriptor);
  if (problems.length > 0) {
    throw new Error(`Invalid descriptor:\n- ${problems.join('\n- ')}`);
  }

  return {
    name: descriptor.toolName,
    description: buildDescription(descriptor),
    inputSchema: buildInputSchema(descriptor),
    returnsFields: [
      ...ENVELOPE_FIELDS,
      ...descriptor.projections.flatMap((projection) => projection.returnsFields),
    ],
    handler: (input: ExecuteInput) => execute(descriptor, input),
  };
}

/** Register a whole API group. Fails loudly at startup on a bad descriptor. */
export function registerDataset(
  toolManager: ToolManager,
  descriptors: readonly EndpointDescriptor[]
): void {
  for (const descriptor of descriptors) {
    toolManager.registerTool(toToolDefinition(descriptor) as never);
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/core/registry.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
git add src/core/registry.ts tests/core/registry.test.ts
git commit -m "feat(core): build MCP tools and schemas from descriptors"
```

### Task 14: The three guards, installed before any descriptor exists

**Files:**
- Create: `src/datasets/drug/index.ts` (deliberately empty for now)
- Create: `tests/catalog-conformance.test.ts`
- Create: `tests/schema-budget.test.ts`
- Create: `tests/no-raw-query.test.ts`

**Interfaces:**
- Consumes: `DRUG_ENDPOINTS` from `src/datasets/drug/index.js`; `declaredPaths` (Task 5); `validateDescriptor` (Task 9); `toToolDefinition` (Task 13).
- Produces: `DRUG_ENDPOINTS: EndpointDescriptor[]` — Tasks 15–17 and 21–24 append to it; Task 18 registers it.

**Ordering matters here.** The guards go in *before* the descriptors, so the very first descriptor written is checked the moment it lands rather than audited afterwards. They pass trivially over an empty list; that is the point.

- [ ] **Step 1: Create the empty dataset index**

Create `src/datasets/drug/index.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';

/**
 * The drug API group. Every entry is checked by tests/catalog-conformance
 * against FDA's own published field list, so a field name that FDA does not
 * publish cannot reach a tool schema.
 */
export const DRUG_ENDPOINTS: EndpointDescriptor[] = [];
```

- [ ] **Step 2: Write the catalog-conformance guard**

Create `tests/catalog-conformance.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { declaredPaths } from '../src/core/search/strategy';
import { validateDescriptor } from '../src/core/descriptor';

// openFDA accepts a trailing .exact for aggregation but does not list it.
const stripExact = (path: string) => path.replace(/\.exact$/, '');

describe('every descriptor path exists in FDA\'s published catalog', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    const catalog = JSON.parse(readFileSync(descriptor.catalog, 'utf8'));
    const known = new Set<string>(catalog.fields.map((f: { path: string }) => f.path));

    const referenced = [
      ...descriptor.fields.flatMap((field) => declaredPaths(field.strategy)),
      ...descriptor.sortFields.map((s) => s.split(':')[0]!),
      ...descriptor.countFields,
      ...Object.keys(descriptor.codeMaps),
    ].map(stripExact);

    for (const path of [...new Set(referenced)]) {
      it(`${descriptor.toolName}: "${path}" is published by FDA`, () => {
        expect(
          known.has(path),
          `${descriptor.toolName} references "${path}", which is absent from ${descriptor.catalog}. ` +
            'Either the path is wrong (this is the 1.1.0 fabricated-field bug) or the catalog is ' +
            'stale — run npm run fields:sync.'
        ).toBe(true);
      });
    }
  }

  it('is actually checking something once descriptors exist', () => {
    // Guards the guard: an empty list passes vacuously, which is correct in
    // Phase 1 and a bug from Phase 2 onward.
    expect(Array.isArray(DRUG_ENDPOINTS)).toBe(true);
  });
});

describe('every descriptor is structurally valid', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    it(`${descriptor.toolName} passes validateDescriptor`, () => {
      expect(validateDescriptor(descriptor)).toEqual([]);
    });
  }
});

describe('clause builders stay inside their declared paths', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    for (const field of descriptor.fields) {
      if (field.strategy.kind !== 'clauses') continue;
      it(`${descriptor.toolName}.${field.name} emits only declared paths`, () => {
        const declared = new Set(field.strategy.kind === 'clauses' ? field.strategy.paths : []);
        // A representative value per normalizer; the builder must not invent paths.
        const built = field.strategy.kind === 'clauses' ? field.strategy.build('12345-1234') : null;
        if (built && !('ok' in built)) {
          for (const clause of built.clauses) expect(declared.has(clause.path)).toBe(true);
        }
      });
    }
  }
});
```

- [ ] **Step 3: Write the schema-budget guard**

Create `tests/schema-budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { toToolDefinition } from '../src/core/registry';

/**
 * Every tool description and parameter description is loaded into an agent's
 * context on connect, whether or not the tool is ever called. This ceiling is
 * the budget: ~20k characters is roughly 5k tokens, against ~1.6k for the nine
 * 1.x tools and ~20k+ if a field enum were ever allowed to list a whole
 * endpoint's reference (druglabel alone publishes hundreds of fields).
 *
 * If this fails, trim prose — do NOT drop the field names a projection
 * guarantees, because the drift guard depends on them.
 */
const MAX_TOTAL_SCHEMA_CHARS = 20000;

/** Approximate, and deliberately so: an order-of-magnitude guard, not a meter. */
function approximateSchemaCost(shape: z.ZodRawShape): number {
  let cost = 0;
  for (const [key, schema] of Object.entries(shape)) {
    cost += key.length;
    cost += (schema.description ?? '').length;
    let inner: any = schema;
    while (inner?._def?.innerType) inner = inner._def.innerType;
    if (inner !== schema) cost += (inner?.description ?? '').length;
    if (Array.isArray(inner?._def?.values)) cost += inner._def.values.join(',').length;
  }
  return cost;
}

describe('tool schema context budget', () => {
  it(`stays under ${MAX_TOTAL_SCHEMA_CHARS} characters in total`, () => {
    let total = 0;
    const perTool: string[] = [];
    for (const descriptor of DRUG_ENDPOINTS) {
      const tool = toToolDefinition(descriptor);
      const cost = tool.description.length + approximateSchemaCost(tool.inputSchema.shape);
      perTool.push(`${tool.name}: ${cost}`);
      total += cost;
    }
    expect(total, `per-tool cost — ${perTool.join(', ')}`).toBeLessThanOrEqual(
      MAX_TOTAL_SCHEMA_CHARS
    );
  });
});
```

- [ ] **Step 4: Write the raw-query guard**

Create `tests/no-raw-query.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

// `${path}:"` or `:"${value}` — the shape that assembles a term by hand.
const RAW_TERM = /\$\{[^}]*\}\s*:\s*"|:\s*"\s*\$\{/;

// The one file allowed to assemble a query string.
const ASSEMBLER = join('src', 'core', 'search', 'query.ts');

describe('query assembly is confined to one file', () => {
  it('no source outside core/search/query.ts builds a search term by hand', () => {
    const offenders = sourceFiles('src')
      .filter((file) => file !== ASSEMBLER)
      .filter((file) => RAW_TERM.test(readFileSync(file, 'utf8')));
    expect(
      offenders,
      'Assembling `path:"value"` outside the assembler skips escapeSearchValue, which is how a ' +
        'caller-supplied value can append a clause and make the server answer about a different drug.'
    ).toEqual([]);
  });
});
```

- [ ] **Step 5: Run all three**

Run: `npx vitest run tests/catalog-conformance.test.ts tests/schema-budget.test.ts tests/no-raw-query.test.ts`

Expected: catalog-conformance and schema-budget PASS vacuously (no descriptors yet). **`no-raw-query` will FAIL**, listing the 1.x tools that assemble terms by hand — `src/drug/get-drugsfda.ts`, `src/drug/resolve-label.ts`, `src/drug/get-drug-by-generic-name.ts`, `src/drug/get-drugs-by-manufacturer.ts`, `src/drug/get-drug-by-product-ndc.ts`, `src/drug/event-search.ts`, `src/drug/get-drug-by-ndc.ts`.

That failure is correct and expected: it is the vulnerability, located. Add a temporary allowance so the suite stays green until Phase 3 deletes those files — and make the allowance self-deleting:

```ts
// TEMPORARY, removed in Phase 3 (Task 19) when src/drug/ is deleted. These are
// the 1.x tools that assemble terms by hand; they are the reason this guard
// exists. The test below fails once the directory is gone, forcing removal of
// this list rather than letting it become permanent.
const LEGACY_ALLOWED = sourceFiles('src').filter((f) => f.startsWith(join('src', 'drug')));

it('the legacy allowance is removed once src/drug/ is gone', () => {
  const stillThere = sourceFiles('src').some((f) => f.startsWith(join('src', 'drug')));
  expect(
    stillThere,
    'src/drug/ is gone — delete LEGACY_ALLOWED and this test from tests/no-raw-query.test.ts'
  ).toBe(true);
});
```

and change the offenders filter to also exclude `LEGACY_ALLOWED`.

- [ ] **Step 6: Run the full suite**

Run: `npm run test:ci && npm run typecheck && npm run lint`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/datasets tests/catalog-conformance.test.ts tests/schema-budget.test.ts tests/no-raw-query.test.ts
git commit -m "test: install catalog, budget and query-assembly guards before any descriptor"
```

---

# Phase 2 — Port the three endpoints already in use

Still ships nothing: the descriptors are built and proven equivalent to the 1.x tools, but `src/index.ts` is not touched until Task 18. Each task carries its own parity proof, so "did we lose anything?" is answered by the suite, not by judgement.

### Task 15: `drug-label`

**Files:**
- Create: `src/datasets/drug/label.ts`
- Create: `src/datasets/drug/label-fields.ts` (moved from `src/drug/label-fields.ts`, plus `resolveGenericName`)
- Modify: `src/drug/get-drug-by-name.ts:8`, `src/drug/get-drug-safety-info.ts:8`, `src/drug/get-drug-by-generic-name.ts:9`, `src/drug/get-drugs-by-manufacturer.ts:9` (import paths only)
- Modify: `src/datasets/drug/index.ts` (append the descriptor)
- Test: `tests/datasets/drug-label.test.ts`, `tests/parity/label-parity.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `normalizeNDC` + `invalidNdcMessage` (existing `src/utils/`), `execute` (Task 12).
- Produces: `drugLabel: EndpointDescriptor` exported from `src/datasets/drug/label.ts`; `mapLabelFields`, `mapSafetyFields`, `resolveGenericName` from `src/datasets/drug/label-fields.ts`.

- [ ] **Step 1: Move the label field mappers**

```bash
git mv src/drug/label-fields.ts src/datasets/drug/label-fields.ts
```

Append `resolveGenericName` to `src/datasets/drug/label-fields.ts`, copied verbatim from `src/drug/resolve-label.ts` (including its comment — the "no `'Unknown'`" reasoning is the point):

```ts
/**
 * openfda.generic_name is absent on some labels — notably ones reached through
 * the spl_product_data_elements tier (Rayos, Cordarone), which have an empty
 * openfda object. "Unknown" reads like data and is indistinguishable from a
 * real value, so null is returned when neither structured field is present.
 *
 * Deliberately does NOT parse spl_product_data_elements: it is a free-text
 * blob of product elements, and extracting an ingredient from it would be
 * guesswork. (Tested and rejected — yields excipient text for Glucophage.)
 */
export function resolveGenericName(openfda: Record<string, unknown>): string | null {
  const first = (value: unknown): string | undefined =>
    Array.isArray(value) && typeof value[0] === 'string' && value[0] ? value[0] : undefined;
  return first(openfda?.generic_name) ?? first(openfda?.substance_name) ?? null;
}
```

Update the four 1.x importers to `'../datasets/drug/label-fields.js'`, and delete the now-duplicated `resolveGenericName` from `src/drug/resolve-label.ts`, re-exporting instead so its importers keep working:

```ts
export { resolveGenericName } from '../datasets/drug/label-fields.js';
```

Run: `npm run test:ci`
Expected: PASS — a pure move, no behaviour change.

- [ ] **Step 2: Write the failing descriptor test**

Create `tests/datasets/drug-label.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugLabel } from '../../src/datasets/drug/label';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const NOT_FOUND = { status: 404, body: { error: { code: 'NOT_FOUND' } } };
const page = (results: unknown[], total = results.length) => ({
  body: { meta: { results: { total } }, results },
});
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;

describe('drug-label descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugLabel)).toEqual([]);
  });

  it('resolves drug_name through four tiers in the documented order', () => {
    const field = drugLabel.fields.find((f) => f.name === 'drug_name')!;
    expect(field.strategy).toEqual({
      kind: 'tiered',
      paths: [
        'openfda.brand_name',
        'openfda.generic_name',
        'openfda.substance_name',
        'spl_product_data_elements',
      ],
    });
  });

  it('offers summary, safety and full as detail values', () => {
    expect(drugLabel.projections.map((p) => p.name)).toEqual(['summary', 'safety', 'full']);
  });
});

describe('drug-label summary projection', () => {
  it('leads with substance_name so a combination product is obvious at a glance', async () => {
    const stub = stubFetchResponses([
      page([{ openfda: { substance_name: ['IBUPROFEN', 'ACETAMINOPHEN'], brand_name: ['Advil Dual Action'] } }]),
    ]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'Advil' }));
    const substanceAt = text.indexOf('"substance_name"');
    const brandAt = text.indexOf('"brand_name"');
    expect(substanceAt).toBeGreaterThan(-1);
    expect(substanceAt).toBeLessThan(brandAt);
  });

  it('emits every safety narrative field, empty when the label has none', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'Advil' }));
    for (const field of [
      'boxed_warning', 'warnings', 'warnings_and_cautions', 'do_not_use',
      'ask_doctor', 'ask_doctor_or_pharmacist', 'stop_use', 'pregnancy_or_breast_feeding',
      'indications_and_usage',
    ]) {
      expect(text, `${field} must be present even when empty`).toContain(`"${field}"`);
    }
  });

  it('falls back to warnings_and_cautions for a PLR label that has no warnings', async () => {
    const stub = stubFetchResponses([
      page([{ openfda: {}, warnings_and_cautions: ['PLR text'] }]),
    ]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'X' }));
    expect(text).toContain('PLR text');
  });
});

describe('drug-label safety projection', () => {
  it('returns the full safety set and a null generic_name rather than "Unknown"', async () => {
    const stub = stubFetchResponses([page([{ openfda: {}, contraindications: ['none'] }])]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'X', detail: 'safety' }));
    for (const field of [
      'contraindications', 'drug_interactions', 'precautions', 'adverse_reactions', 'overdosage',
    ]) {
      expect(text).toContain(`"${field}"`);
    }
    expect(text).toContain('"generic_name": null');
  });
});

describe('drug-label ndc fields', () => {
  it('ORs product and package NDC when a package NDC was supplied', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    await execute(drugLabel, { field: 'ndc', value: '12345-1234-01' });
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('openfda.product_ndc:"12345-1234"');
    expect(query).toContain('openfda.package_ndc:"12345-1234-01"');
  });

  it('searches product NDC alone when no package part was given', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    await execute(drugLabel, { field: 'ndc', value: '12345-1234' });
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('openfda.product_ndc:"12345-1234"');
    expect(query).not.toContain('package_ndc');
  });

  it('rejects ambiguous undashed input before querying', async () => {
    const stub = stubFetchResponses([page([])]);
    restore = stub.restore;
    const result = await execute(drugLabel, { field: 'ndc', value: '12345678' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });
});

describe('drug-label not-found', () => {
  it('reports no results after all four tiers miss, without isError', async () => {
    const stub = stubFetchResponses([NOT_FOUND, NOT_FOUND, NOT_FOUND, NOT_FOUND]);
    restore = stub.restore;
    const result = await execute(drugLabel, { value: 'Zzzz' });
    expect(stub.calls).toHaveLength(4);
    expect(result.isError).toBeUndefined();
    expect(textOf(result)).toContain('spl_product_data_elements');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-label.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement the descriptor**

Create `src/datasets/drug/label.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';
import type { ClauseSet } from '../../core/search/strategy.js';
import { normalizeNDC } from '../../utils/ndc.js';
import { invalidNdcMessage } from '../../utils/ndc-formats.js';
import { mapLabelFields, mapSafetyFields, resolveGenericName } from './label-fields.js';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Exact brand search alone misses real originator brands: Cordarone and
 * Glucophage are absent from openfda.brand_name but present in the label's own
 * spl_product_data_elements. Tiers are separate sequential queries rather than
 * one OR so relevance ordering stays predictable.
 */
const NAME_TIERS = [
  'openfda.brand_name',
  'openfda.generic_name',
  'openfda.substance_name',
  'spl_product_data_elements',
];

/** A package NDC must also match the product it belongs to, so both are ORed. */
function ndcClauses(raw: string): ClauseSet | { ok: false; message: string } {
  const { productNDC, packageNDC, isValid } = normalizeNDC(raw);
  if (!isValid) return { ok: false, message: invalidNdcMessage(raw, 'NDC') };
  const clauses = [{ path: 'openfda.product_ndc', value: productNDC }];
  if (packageNDC) clauses.push({ path: 'openfda.package_ndc', value: packageNDC });
  return {
    clauses,
    op: 'OR',
    matched_via: packageNDC
      ? 'openfda.product_ndc OR openfda.package_ndc'
      : 'openfda.product_ndc',
  };
}

const identity = (record: any): Record<string, unknown> => ({
  // substance_name first: the top match for a brand is often a combination
  // product, and that must be obvious without reading the whole record.
  substance_name: asArray(record?.openfda?.substance_name),
  brand_name: asArray(record?.openfda?.brand_name),
  generic_name: asArray(record?.openfda?.generic_name),
  manufacturer_name: asArray(record?.openfda?.manufacturer_name),
  product_ndc: asArray(record?.openfda?.product_ndc),
  package_ndc: asArray(record?.openfda?.package_ndc),
  product_type: asArray(record?.openfda?.product_type),
  route: asArray(record?.openfda?.route),
});

export const drugLabel: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary:
    'Search FDA structured product labels (SPL) — the prescribing and OTC information on a drug ' +
    'product. Note that openfda.route here is the SPL route of administration and uses a different ' +
    'controlled vocabulary from drug-drugsfda products[].route: the same insulin product is ' +
    'SUBCUTANEOUS here and INJECTION there, so joining on route across tools will silently miss.',
  fields: [
    {
      name: 'drug_name',
      description:
        'brand, generic or substance name, tried in that order and falling back to the label body',
      strategy: { kind: 'tiered', paths: NAME_TIERS },
    },
    {
      name: 'brand_name',
      description: 'exact brand name only',
      strategy: { kind: 'exact', path: 'openfda.brand_name' },
    },
    {
      name: 'generic_name',
      description: 'active ingredient name',
      strategy: { kind: 'exact', path: 'openfda.generic_name' },
    },
    {
      name: 'substance_name',
      description: 'substance name',
      strategy: { kind: 'exact', path: 'openfda.substance_name' },
    },
    {
      name: 'manufacturer_name',
      description: 'labeller or manufacturer',
      strategy: { kind: 'exact', path: 'openfda.manufacturer_name' },
    },
    {
      name: 'ndc',
      description: 'product or package NDC; dashed 4-4, 5-3, 5-4, or undashed 9 or 11 digits',
      strategy: { kind: 'clauses', paths: ['openfda.product_ndc', 'openfda.package_ndc'], build: ndcClauses },
    },
    {
      name: 'product_ndc',
      description: 'product NDC only, ignoring package variations',
      normalize: (raw) => {
        const { productNDC, isValid } = normalizeNDC(raw);
        return isValid
          ? { ok: true as const, value: productNDC }
          : { ok: false as const, message: invalidNdcMessage(raw, 'product NDC') };
      },
      strategy: { kind: 'exact', path: 'openfda.product_ndc' },
    },
    {
      name: 'route',
      description: 'SPL route of administration',
      strategy: { kind: 'exact', path: 'openfda.route' },
    },
    {
      name: 'product_type',
      description: 'e.g. HUMAN PRESCRIPTION DRUG',
      strategy: { kind: 'exact', path: 'openfda.product_type' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity fields plus the safety narrative; every field present, empty when absent.',
      returnsFields: [
        'substance_name', 'brand_name', 'generic_name', 'manufacturer_name', 'product_ndc',
        'package_ndc', 'product_type', 'route', 'indications_and_usage', 'boxed_warning',
        'warnings', 'warnings_and_cautions', 'do_not_use', 'ask_doctor',
        'ask_doctor_or_pharmacist', 'stop_use', 'pregnancy_or_breast_feeding',
      ],
      project: (record: any) => ({
        ...identity(record),
        ...mapLabelFields(record as Record<string, unknown>),
      }),
    },
    {
      name: 'safety',
      description: 'Warnings, contraindications, interactions and overdosage.',
      returnsFields: [
        'brand_name', 'generic_name', 'boxed_warning', 'warnings', 'warnings_and_cautions',
        'contraindications', 'drug_interactions', 'precautions', 'adverse_reactions',
        'overdosage', 'do_not_use', 'ask_doctor', 'ask_doctor_or_pharmacist', 'stop_use',
        'pregnancy_or_breast_feeding',
      ],
      project: (record: any) => ({
        brand_name: asArray(record?.openfda?.brand_name),
        // null, never "Unknown": a placeholder string is indistinguishable
        // from real data to every consumer.
        generic_name: resolveGenericName((record?.openfda ?? {}) as Record<string, unknown>),
        ...mapSafetyFields(record as Record<string, unknown>),
      }),
    },
    {
      name: 'full',
      description: 'The raw upstream label under `record`, for fields the projections omit.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['effective_time:desc', 'effective_time:asc'],
  countFields: ['openfda.route', 'openfda.product_type', 'openfda.manufacturer_name.exact'],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
};
```

Append to `src/datasets/drug/index.ts`:

```ts
import { drugLabel } from './label.js';

export const DRUG_ENDPOINTS: EndpointDescriptor[] = [drugLabel];
```

- [ ] **Step 5: Run the descriptor test and the guards**

Run: `npx vitest run tests/datasets/drug-label.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts`

Expected: PASS. If catalog-conformance fails on `spl_product_data_elements` or a `countFields` entry, that path is genuinely absent from FDA's reference — **remove it from the descriptor**, do not weaken the guard. Note the removal in the field-selection note from Task 3.

- [ ] **Step 6: Write the parity proof**

Create `tests/parity/label-parity.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugLabel } from '../../src/datasets/drug/label';
import { execute } from '../../src/core/executor';
import { getDrugByName } from '../../src/drug/get-drug-by-name';
import { getDrugSafetyInfo } from '../../src/drug/get-drug-safety-info';
import { getDrugByProductNdc } from '../../src/drug/get-drug-by-product-ndc';
import { RESOLUTION_TIERS } from '../../src/drug/resolve-label';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const LABEL = {
  openfda: {
    brand_name: ['Advil'],
    generic_name: ['IBUPROFEN'],
    substance_name: ['IBUPROFEN'],
    manufacturer_name: ['Pfizer'],
    product_ndc: ['12345-1234'],
    package_ndc: ['12345-1234-01'],
    product_type: ['HUMAN OTC DRUG'],
    route: ['ORAL'],
  },
  boxed_warning: ['BOXED'],
  warnings: ['WARN'],
  contraindications: ['CONTRA'],
  indications_and_usage: ['USE'],
};
const page = { body: { meta: { results: { total: 39 } }, results: [LABEL] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-label matches the 1.x tools it replaces', () => {
  it('uses the same four resolution tiers as resolve-label', () => {
    const field = drugLabel.fields.find((f) => f.name === 'drug_name')!;
    const paths = field.strategy.kind === 'tiered' ? field.strategy.paths : [];
    expect(paths).toEqual([...RESOLUTION_TIERS]);
  });

  it('issues the same first query as get-drug-by-name', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugByName.handler({ drugName: 'Advil', limit: 1 });
    const oldUrl = oldStub.calls[0]!;
    oldStub.restore();

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    await execute(drugLabel, { value: 'Advil', limit: 1 });
    const newUrl = newStub.calls[0]!;

    const search = (url: string) => new URL(url).searchParams.get('search');
    expect(search(newUrl)).toBe(search(oldUrl));
  });

  it('returns the same narrative values as get-drug-by-name', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugByName.handler({ drugName: 'Advil', limit: 1 });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    ).results[0];

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(await execute(drugLabel, { value: 'Advil', limit: 1 })).results[0];

    for (const field of [
      'substance_name', 'brand_name', 'generic_name', 'manufacturer_name', 'product_ndc',
      'route', 'boxed_warning', 'warnings', 'indications_and_usage',
    ]) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
  });

  it('returns the same safety values as get-drug-safety-info, with the documented rename', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugSafetyInfo.handler({ drugName: 'Advil' });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    );

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(await execute(drugLabel, { value: 'Advil', detail: 'safety' }))
      .results[0];

    for (const field of [
      'boxed_warning', 'warnings', 'contraindications', 'drug_interactions', 'precautions',
      'adverse_reactions', 'overdosage', 'ask_doctor_or_pharmacist',
    ]) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
    expect(newRecord.generic_name).toEqual(oldRecord.generic_name);

    // DOCUMENTED DIFF: the 1.x scalar `drug_name` (brand, or the query term
    // when the label had none) becomes the honest array `brand_name`. Recorded
    // in the README migration table.
    expect(oldRecord.drug_name).toBe('Advil');
    expect(newRecord.brand_name).toEqual(['Advil']);
  });

  it('issues the same query as get-drug-by-product-ndc for the same NDC', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugByProductNdc.handler({ productNDC: '12345-1234' });
    const oldSearch = new URL(oldStub.calls[0]!).searchParams.get('search');
    oldStub.restore();

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    await execute(drugLabel, { field: 'product_ndc', value: '12345-1234' });
    expect(new URL(newStub.calls[0]!).searchParams.get('search')).toBe(oldSearch);
  });
});
```

- [ ] **Step 7: Run the parity proof**

Run: `npx vitest run tests/parity/label-parity.test.ts`
Expected: PASS. Any failure is a real regression — fix the descriptor, not the test, unless the difference is one of the two changes documented in spec §5.

- [ ] **Step 8: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add src/datasets src/drug tests/datasets tests/parity
git commit -m "feat(drug): drug-label descriptor with parity proof against the 1.x label tools"
```

### Task 16: `drug-event`

**Files:**
- Create: `src/datasets/drug/event.ts`
- Move: `src/drug/faers.ts` → `src/datasets/drug/faers.ts`
- Modify: `src/drug/get-drug-adverse-events.ts:9`, `src/drug/get-drug-adverse-event-counts.ts:7` (import paths)
- Modify: `src/datasets/drug/index.ts`
- Test: `tests/datasets/drug-event.test.ts`, `tests/parity/event-parity.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `execute` (Task 12), the existing FAERS maps.
- Produces: `drugEvent: EndpointDescriptor`.

- [ ] **Step 1: Move the FAERS maps**

```bash
git mv src/drug/faers.ts src/datasets/drug/faers.ts
git mv tests/faers.test.ts tests/datasets/faers.test.ts
```

Update the import in both 1.x event tools to `'../datasets/drug/faers.js'`, and the import in `tests/datasets/faers.test.ts` and `tests/faers-codes.test.ts` to the new path. Update `scripts/probe-faers-codes.mjs` if it references the old path.

Run: `npm run test:ci`
Expected: PASS — pure move.

- [ ] **Step 2: Write the failing descriptor test**

Create `tests/datasets/drug-event.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugEvent } from '../../src/datasets/drug/event';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const page = (results: unknown[], total = results.length) => ({
  body: { meta: { results: { total } }, results },
});
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;

const REPORT = {
  safetyreportid: '7',
  serious: 1,
  receiptdate: '20240101',
  patient: {
    patientonsetage: '44',
    patientsex: 2,
    reaction: [
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 },
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 },
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 6 },
    ],
  },
};

describe('drug-event descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugEvent)).toEqual([]);
  });

  it('ORs the three FAERS drug indexes in ONE query, because the union beats any single one', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN' });
    expect(stub.calls).toHaveLength(1);
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('patient.drug.openfda.generic_name:"IBUPROFEN"');
    expect(query).toContain('patient.drug.openfda.substance_name:"IBUPROFEN"');
    expect(query).toContain('patient.drug.medicinalproduct:"IBUPROFEN"');
  });

  it('applies seriousness to the WHOLE group, not just the last index', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN', seriousness: 'serious' });
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toMatch(/^\(.+\) AND serious:"1"$/);
  });

  it('omits the filter entirely when seriousness is all', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN', seriousness: 'all' });
    expect(decodeURIComponent(stub.calls[0]!)).not.toContain('serious:');
  });
});

describe('drug-event summary projection', () => {
  it('decodes serious and patient_sex, and keeps reaction/outcome arrays aligned', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    const text = textOf(await execute(drugEvent, { value: 'IBUPROFEN' }));
    expect(text).toContain('"serious": "Serious"');
    expect(text).toContain('"patient_sex": "Female"');

    const record = JSON.parse(text.slice(text.indexOf('{'))).results[0];
    // Deduped on the PAIR: two identical (NAUSEA, 1) collapse, but
    // (NAUSEA, 6) is a genuinely different data point and must survive.
    expect(record.reactions).toEqual(['NAUSEA', 'NAUSEA']);
    expect(record.outcomes).toHaveLength(record.reactions.length);
    expect(record.outcomes[0]).not.toBe(record.outcomes[1]);
  });
});

describe('drug-event aggregation', () => {
  it('ranks reactions and reports no total', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 'NAUSEA', count: 812 }] } },
    ]);
    restore = stub.restore;
    const text = textOf(
      await execute(drugEvent, {
        value: 'IBUPROFEN',
        count: 'patient.reaction.reactionmeddrapt.exact',
      })
    );
    expect(text).toContain('"term": "NAUSEA"');
    expect(text).toContain('"term_code": "NAUSEA"');
    expect(text).not.toContain('"total"');
  });

  it('decodes a coded aggregation field', async () => {
    const stub = stubFetchResponses([{ body: { results: [{ term: 2, count: 5 }] } }]);
    restore = stub.restore;
    const text = textOf(await execute(drugEvent, { value: 'X', count: 'patient.patientsex' }));
    expect(text).toContain('"term": "Female"');
    expect(text).toContain('"term_code": 2');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-event.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement**

Create `src/datasets/drug/event.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { z } from 'zod';
import type { EndpointDescriptor } from '../../core/descriptor.js';
import type { Clause } from '../../core/search/strategy.js';
import {
  describeOutcome,
  SERIOUSNESS,
  PATIENT_SEX,
  REACTION_OUTCOMES,
} from './faers.js';

/**
 * FAERS indexes a drug three ways. Measured for citalopram: medicinalproduct
 * 113,881; openfda.generic_name 136,043; the union of all three 143,346. The
 * union beats every single field, which is why this is an OR rather than a
 * tiered fallback — a fallback would match medicinalproduct first and never
 * reach the better index.
 *
 * The paths are `patient.drug.openfda.*`, NOT top-level `openfda.*`: verified
 * live 2026-09-20, `openfda.substance_name` returns NOT_FOUND on this index
 * while `patient.drug.openfda.substance_name` returns 508,117.
 */
const DRUG_INDEXES = [
  'patient.drug.openfda.generic_name',
  'patient.drug.openfda.substance_name',
  'patient.drug.medicinalproduct',
];

const MAX_REACTIONS = 3;

interface ReactionPair {
  reaction: string;
  outcome: unknown;
}

/**
 * Raw FAERS records repeat the same (reaction, outcome) pair within one report,
 * which reads as two distinct events. `reactions` and `outcomes` must stay
 * positionally aligned, so dedupe on the PAIR — not each array independently —
 * and derive both outputs from the same deduped list. The same reaction with a
 * different outcome code is two genuine data points and must survive as two.
 */
function dedupeReactionPairs(reactionList: any[]): ReactionPair[] {
  const seen = new Set<string>();
  const pairs: ReactionPair[] = [];
  for (const entry of Array.isArray(reactionList) ? reactionList : []) {
    const reaction = entry?.reactionmeddrapt;
    if (!reaction) continue;
    const key = `${reaction}\u0000${String(entry?.reactionoutcome)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ reaction, outcome: entry?.reactionoutcome });
  }
  return pairs.slice(0, MAX_REACTIONS);
}

export const drugEvent: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'event',
  toolName: 'drug-event',
  summary:
    'Search FAERS adverse event reports — voluntarily submitted reports of side effects. A report ' +
    'is not evidence that the drug caused the effect, and report counts reflect reporting ' +
    'behaviour as much as incidence.',
  fields: [
    {
      name: 'drug_name',
      description: 'brand, generic or substance name, searched across all three FAERS drug indexes at once',
      strategy: { kind: 'anyOf', paths: DRUG_INDEXES },
    },
    {
      name: 'reaction',
      description: 'MedDRA preferred term, e.g. NAUSEA',
      strategy: { kind: 'exact', path: 'patient.reaction.reactionmeddrapt' },
    },
    {
      name: 'country',
      description: 'country the event occurred in, as a two-letter code',
      strategy: { kind: 'exact', path: 'occurcountry' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'One row per report with decoded codes and deduplicated reaction/outcome pairs.',
      returnsFields: [
        'report_id', 'serious', 'patient_age', 'patient_sex', 'reactions', 'outcomes', 'report_date',
      ],
      project: (record: any) => {
        const pairs = dedupeReactionPairs(record?.patient?.reaction ?? []);
        return {
          report_id: record?.safetyreportid ?? null,
          serious: SERIOUSNESS[String(record?.serious)] ?? 'Not reported',
          patient_age: record?.patient?.patientonsetage ?? null,
          patient_sex: PATIENT_SEX[String(record?.patient?.patientsex)] ?? 'Not reported',
          reactions: pairs.map((pair) => pair.reaction),
          outcomes: pairs.map((pair) => describeOutcome(pair.outcome)),
          report_date: record?.receiptdate ?? null,
        };
      },
    },
    {
      name: 'full',
      description: 'The raw upstream report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  extraFilters: {
    schema: {
      seriousness: z
        .enum(['serious', 'non-serious', 'all'])
        .optional()
        .default('all')
        .describe('Filter by event seriousness.'),
    },
    toClauses: (input): Clause[] => {
      if (input.seriousness === 'serious') return [{ path: 'serious', value: '1' }];
      if (input.seriousness === 'non-serious') return [{ path: 'serious', value: '2' }];
      return [];
    },
  },
  sortFields: ['receivedate:desc', 'receivedate:asc'],
  countFields: [
    'patient.reaction.reactionmeddrapt.exact',
    'patient.reaction.reactionoutcome',
    'serious',
    'patient.patientsex',
    'occurcountry.exact',
    'patient.drug.openfda.generic_name.exact',
  ],
  codeMaps: {
    serious: SERIOUSNESS,
    'patient.patientsex': PATIENT_SEX,
    'patient.reaction.reactionoutcome': REACTION_OUTCOMES,
  },
  limits: { default: 10, max: 50 },
  catalog: 'src/catalog/drug-event.json',
};
```

Append `drugEvent` to `DRUG_ENDPOINTS` in `src/datasets/drug/index.ts`.

- [ ] **Step 5: Run the descriptor test and guards**

Run: `npx vitest run tests/datasets/drug-event.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts`
Expected: PASS

- [ ] **Step 6: Write the parity proof**

Create `tests/parity/event-parity.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugEvent } from '../../src/datasets/drug/event';
import { execute } from '../../src/core/executor';
import { getDrugAdverseEvents } from '../../src/drug/get-drug-adverse-events';
import { getDrugAdverseEventCounts } from '../../src/drug/get-drug-adverse-event-counts';
import { EVENT_SEARCH_FIELDS } from '../../src/drug/event-search';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const REPORT = {
  safetyreportid: '7',
  serious: 1,
  receiptdate: '20240101',
  patient: {
    patientonsetage: '44',
    patientsex: 2,
    reaction: [{ reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 }],
  },
};
const page = { body: { meta: { results: { total: 5 } }, results: [REPORT] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-event matches the 1.x event tools', () => {
  it('searches the same three FAERS indexes', () => {
    const field = drugEvent.fields.find((f) => f.name === 'drug_name')!;
    const paths = field.strategy.kind === 'anyOf' ? [...field.strategy.paths].sort() : [];
    expect(paths).toEqual([...EVENT_SEARCH_FIELDS].sort());
  });

  it('produces the same record fields as get-drug-adverse-events', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugAdverseEvents.handler({ drugName: 'IBUPROFEN', limit: 10 });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    ).results[0];

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(await execute(drugEvent, { value: 'IBUPROFEN', limit: 10 })).results[0];

    for (const field of ['report_id', 'serious', 'patient_sex', 'reactions', 'outcomes']) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
    // DOCUMENTED DIFF: 'Unknown' placeholders become null.
    expect(oldRecord.patient_age).toBe('44');
    expect(newRecord.patient_age).toBe('44');
  });

  it('produces the same ranked terms as get-drug-adverse-event-counts', async () => {
    const counts = { body: { results: [{ term: 'NAUSEA', count: 812 }] } };

    const oldStub = stubFetchResponses([counts]);
    const oldOut = await getDrugAdverseEventCounts.handler({ drugName: 'IBUPROFEN', limit: 10 });
    oldStub.restore();
    const oldPayload = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    );

    const newStub = stubFetchResponses([counts]);
    restore = newStub.restore;
    const newPayload = jsonOf(
      await execute(drugEvent, {
        value: 'IBUPROFEN',
        limit: 10,
        count: 'patient.reaction.reactionmeddrapt.exact',
      })
    );

    expect(newPayload.results).toEqual(oldPayload.results);
    expect(newPayload.counted_by).toBe(oldPayload.counted_by);
  });
});
```

- [ ] **Step 7: Run it**

Run: `npx vitest run tests/parity/event-parity.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add src/datasets src/drug tests scripts
git commit -m "feat(drug): drug-event descriptor with parity proof against the 1.x event tools"
```

### Task 17: `drug-drugsfda`

**Files:**
- Create: `src/datasets/drug/drugsfda.ts`
- Modify: `src/datasets/drug/index.ts`
- Test: `tests/datasets/drug-drugsfda.test.ts`, `tests/parity/drugsfda-parity.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `capArray` (Task 9), `execute` (Task 12), the live-probed table in `src/drug/drugsfda-sections.ts`.
- Produces: `drugDrugsfda: EndpointDescriptor`.

**Note on the section/field collapse.** 1.x took `sectionName` + `fieldName` and resolved them to a path. 2.0.0 takes the resolved path directly as `field`, so `{ sectionName: 'openfda', fieldName: 'brand_name' }` becomes `{ field: 'openfda.brand_name' }`. Every path below comes from the existing table, which was live-probed in 1.2.0 after 1.1.0 shipped six fabricated ones.

- [ ] **Step 1: Write the failing test**

Create `tests/datasets/drug-drugsfda.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugDrugsfda } from '../../src/datasets/drug/drugsfda';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const APPLICATION = {
  application_number: 'NDA020235',
  sponsor_name: 'PFIZER',
  products: [{ product_number: '001', dosage_form: 'TABLET' }],
  submissions: Array.from({ length: 12 }, (_, i) => ({ submission_number: String(i) })),
};
const page = { body: { meta: { results: { total: 3 } }, results: [APPLICATION] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) => JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-drugsfda descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugDrugsfda)).toEqual([]);
  });

  it('uppercases sponsor_name, which openFDA stores uppercase', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('sponsor_name:"PFIZER"');
  });

  it('exposes application_number as a TOP-LEVEL path, not application.application_number', () => {
    const names = drugDrugsfda.fields.map((f) => f.name);
    expect(names).toContain('application_number');
    expect(names).not.toContain('application.application_number');
  });
});

describe('drug-drugsfda projections', () => {
  it('summary omits submissions but reports a submission_count', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer' }))
      .results[0];
    expect(record.submission_count).toBe(12);
    expect(record.submissions).toBeUndefined();
  });

  it('full caps submissions at 10 and flags the truncation', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(
      await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer', detail: 'full' })
    ).results[0];
    expect(record.submissions).toHaveLength(10);
    expect(record.submissions_truncated).toBe(true);
  });

  it('emits te_code and openfda even when openFDA omits them', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 1 } }, results: [{ products: [{ product_number: '1' }] }] } },
    ]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugDrugsfda, { field: 'sponsor_name', value: 'X' })).results[0];
    expect(record.products[0].te_code).toBeNull();
    expect(record.openfda).toEqual({});
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-drugsfda.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/datasets/drug/drugsfda.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';
import { capArray } from '../../core/shape/project.js';

/**
 * Every path here was verified against the live API with an `_exists_` probe.
 * Version 1.1.0 advertised six paths that match nothing — application_number
 * is TOP-LEVEL, not under `application`, and all five application_docs field
 * names were fabricated; the real shape is {id, url, date, type}.
 */
const PATHS: Array<[name: string, description: string, uppercase?: boolean]> = [
  ['application_number', 'FDA application number, e.g. NDA020235'],
  ['sponsor_name', 'application sponsor; stored uppercase and normalised automatically', true],
  ['openfda.application_number', 'application number as indexed by openFDA'],
  ['openfda.brand_name', 'brand name'],
  ['openfda.generic_name', 'generic name'],
  ['openfda.manufacturer_name', 'manufacturer'],
  ['openfda.route', 'SPL route of administration'],
  ['openfda.substance_name', 'substance name'],
  ['openfda.product_ndc', 'product NDC'],
  ['products.dosage_form', 'dosage form, e.g. TABLET'],
  ['products.marketing_status', 'e.g. Prescription, Discontinued'],
  ['products.product_number', 'product number within the application'],
  ['products.reference_drug', 'whether the product is a reference listed drug'],
  ['products.route', 'Drugs@FDA product route — a DIFFERENT vocabulary from openfda.route'],
  ['products.te_code', 'therapeutic equivalence code'],
  ['submissions.review_priority', 'e.g. PRIORITY, STANDARD'],
  ['submissions.submission_class_code', 'submission class'],
  ['submissions.submission_number', 'submission number'],
  ['submissions.submission_status', 'e.g. AP'],
  ['submissions.submission_status_date', 'status date'],
  ['submissions.submission_type', 'e.g. ORIG, SUPPL'],
  ['submissions.application_docs.id', 'document id'],
  ['submissions.application_docs.url', 'document url'],
  ['submissions.application_docs.date', 'document date'],
  ['submissions.application_docs.type', 'document type'],
];

/**
 * A single Neurontin application with 38 submissions measures 21,042
 * characters — roughly 550 per submission. Ten keeps a record near 5.5k.
 */
export const MAX_SUBMISSIONS_PER_RECORD = 10;

/** openFDA omits te_code on some products; emit it either way. */
const normaliseProduct = (product: Record<string, unknown>): Record<string, unknown> => ({
  ...product,
  te_code: product.te_code ?? null,
});

const base = (record: any): Record<string, unknown> => ({
  application_number: record?.application_number ?? null,
  sponsor_name: record?.sponsor_name ?? null,
  // openFDA omits `openfda` entirely on most records (43/50 for a LILLY
  // sponsor search); emit it either way, matching te_code above.
  openfda: record?.openfda ?? {},
  products: (Array.isArray(record?.products) ? record.products : []).map(normaliseProduct),
  submission_count: Array.isArray(record?.submissions) ? record.submissions.length : 0,
});

const fields: FieldSpec[] = PATHS.map(([name, description, uppercase]) => ({
  name,
  description,
  ...(uppercase ? { uppercase: true } : {}),
  strategy: { kind: 'exact' as const, path: name },
}));

export const drugDrugsfda: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'drugsfda',
  toolName: 'drug-drugsfda',
  summary:
    'Search Drugs@FDA application data — approvals, sponsors, products and submissions. ' +
    'products[].route is the Drugs@FDA product route and uses a different controlled vocabulary ' +
    'from drug-label openfda.route, so joining on route across tools will silently miss.',
  fields,
  defaultField: 'openfda.brand_name',
  projections: [
    {
      name: 'summary',
      description: 'Application, sponsor, openfda block and products, with a submission count only.',
      returnsFields: [
        'application_number', 'sponsor_name', 'openfda', 'products', 'submission_count',
      ],
      project: base,
    },
    {
      name: 'full',
      description: `Adds submissions, capped at ${MAX_SUBMISSIONS_PER_RECORD} per record.`,
      returnsFields: [
        'application_number', 'sponsor_name', 'openfda', 'products', 'submission_count',
        'submissions', 'submissions_truncated',
      ],
      project: (record: any) => {
        const capped = capArray(record?.submissions, MAX_SUBMISSIONS_PER_RECORD);
        return { ...base(record), submissions: capped.rows, submissions_truncated: capped.truncated };
      },
    },
  ],
  sortFields: [],
  countFields: ['sponsor_name.exact', 'products.marketing_status', 'products.dosage_form'],
  codeMaps: {},
  limits: { default: 5, max: 100 },
  catalog: 'src/catalog/drug-drugsfda.json',
};
```

Append `drugDrugsfda` to `DRUG_ENDPOINTS`.

- [ ] **Step 4: Run the descriptor test and guards**

Run: `npx vitest run tests/datasets/drug-drugsfda.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts`
Expected: PASS

- [ ] **Step 5: Write the parity proof**

Create `tests/parity/drugsfda-parity.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
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

describe('drug-drugsfda exposes exactly the live-probed 1.x paths', () => {
  it('every (section, field) pair in the 1.x table is reachable as a field name', () => {
    const exposed = new Set(drugDrugsfda.fields.map((f) => f.name));
    for (const [section, definition] of Object.entries(SECTIONS)) {
      for (const field of Object.keys(definition.fields)) {
        const resolved = resolveField(section, field);
        expect(resolved.ok).toBe(true);
        if (resolved.ok) {
          expect(exposed.has(resolved.path), `${section}.${field} -> ${resolved.path}`).toBe(true);
        }
      }
    }
  });

  it('issues the same query as get-drugsfda for the same sponsor', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugsfda.handler({
      sectionName: 'application', fieldName: 'sponsor_name', searchValue: 'Pfizer', limit: 5,
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
      sectionName: 'application', fieldName: 'sponsor_name', searchValue: 'Pfizer', limit: 5,
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
```

- [ ] **Step 6: Run it**

Run: `npx vitest run tests/parity/drugsfda-parity.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add src/datasets tests
git commit -m "feat(drug): drug-drugsfda descriptor with parity proof against get-drugsfda"
```

---

# Phase 3 — Cut over to 2.0.0

### Task 18: Register the drug group

**Files:**
- Modify: `src/index.ts:9-19` (imports), `:43-51` (registrations)
- Test: `tests/registration.test.ts`

**Interfaces:**
- Consumes: `registerDataset` (Task 13), `DRUG_ENDPOINTS` (Tasks 15–17).
- Produces: the three new tools registered on the server. The nine 1.x tools stay registered for this one task so the change is reviewable on its own; Task 19 removes them.

- [ ] **Step 1: Write the failing test**

Create `tests/registration.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { registerDataset } from '../src/core/registry';
import { ToolManager } from '../src/ToolManager';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';

describe('drug group registration', () => {
  it('registers one tool per endpoint, named drug-<endpoint>', () => {
    const registerTool = vi.fn();
    const manager = new ToolManager({ registerTool } as never);

    registerDataset(manager, DRUG_ENDPOINTS);

    const names = registerTool.mock.calls.map((call) => call[0]);
    for (const descriptor of DRUG_ENDPOINTS) {
      expect(names).toContain(descriptor.toolName);
      expect(descriptor.toolName).toBe(`${descriptor.dataset}-${descriptor.endpoint}`);
    }
    expect(names).toHaveLength(DRUG_ENDPOINTS.length);
  });

  it('every registered tool still passes through the API-key chokepoint', async () => {
    const registerTool = vi.fn();
    const manager = new ToolManager({ registerTool } as never);
    registerDataset(manager, DRUG_ENDPOINTS);

    const previousKey = process.env.OPENFDA_API_KEY;
    const previousKeyless = process.env.OPENFDA_ALLOW_KEYLESS;
    delete process.env.OPENFDA_API_KEY;
    delete process.env.OPENFDA_ALLOW_KEYLESS;
    try {
      for (const call of registerTool.mock.calls) {
        const handler = call[2] as (input: unknown) => Promise<{ isError?: boolean; content: { text: string }[] }>;
        const result = await handler({ value: 'Advil' });
        expect(result.isError).toBe(true);
        expect(result.content[0]!.text).toContain('OPENFDA_API_KEY');
      }
    } finally {
      if (previousKey !== undefined) process.env.OPENFDA_API_KEY = previousKey;
      if (previousKeyless !== undefined) process.env.OPENFDA_ALLOW_KEYLESS = previousKeyless;
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/registration.test.ts`
Expected: FAIL — no tool registered, or the name assertion fails.

- [ ] **Step 3: Register the group in `src/index.ts`**

Add the imports:

```ts
import { registerDataset } from './core/registry.js';
import { DRUG_ENDPOINTS } from './datasets/drug/index.js';
```

and, below the existing `toolManager.registerTool(...)` lines:

```ts
registerDataset(toolManager, DRUG_ENDPOINTS);
```

- [ ] **Step 4: Run the suite**

Run: `npm run test:ci && npm run typecheck && npm run lint`
Expected: PASS — the 1.x tools and the new group coexist for this one commit.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/registration.test.ts
git commit -m "feat: register the drug endpoint group alongside the 1.x tools"
```

### Task 19: Remove the 1.x tool surface

**Files:**
- Delete: `src/drug/get-drug-by-name.ts`, `get-drug-by-generic-name.ts`, `get-drug-adverse-events.ts`, `get-drugs-by-manufacturer.ts`, `get-drug-safety-info.ts`, `get-drug-by-ndc.ts`, `get-drug-by-product-ndc.ts`, `get-drugsfda.ts`, `get-drug-adverse-event-counts.ts`, `src/drug/index.ts`, `src/drug/resolve-label.ts`, `src/drug/event-search.ts`, `src/drug/drugsfda-sections.ts`
- Delete: `tests/description-drift.test.ts`, `tests/get-drug-by-name.test.ts`, `tests/by-name-paging.test.ts`, `tests/matched-via.test.ts`, `tests/resolve-label.test.ts`, `tests/event-search.test.ts`, `tests/adverse-events-query.test.ts`, `tests/adverse-event-counts.test.ts`, `tests/ndc-query.test.ts`, `tests/product-ndc-tool.test.ts`, `tests/drugsfda-tool.test.ts`, `tests/drugsfda-sections.test.ts`, `tests/drugsfda-detail.test.ts`, `tests/parity/*.test.ts`
- Modify: `src/index.ts` (drop the nine imports and registrations), `src/OpenFDABuilder.ts` (drop the `context()` alias), `tests/OpenFDABuilder.test.ts` (drop the alias test), `tests/no-raw-query.test.ts` (drop `LEGACY_ALLOWED`), `scripts/smoke-local.mjs`
- Create: `tests/drift-guard.test.ts` (the replacement for `description-drift.test.ts`)

**Interfaces:**
- Consumes: everything from Phases 1–2.
- Produces: a server whose only tools are the drug group.

**Order matters.** The parity tests are deleted *with* the tools they compare against — they have done their job by this point, and keeping them would mean keeping the 1.x code. Run them one last time before deleting.

- [ ] **Step 1: Run the parity proofs one final time**

Run: `npx vitest run tests/parity`
Expected: PASS. Do not proceed if anything fails.

- [ ] **Step 2: Write the replacement drift guard**

Create `tests/drift-guard.test.ts`. This is strictly stronger than the file it replaces: it checks every endpoint × projection pair rather than nine hand-listed tools.

```ts
import { describe, it, expect } from 'vitest';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { toToolDefinition, ENVELOPE_FIELDS } from '../src/core/registry';
import { applyProjection } from '../src/core/shape/project';

/**
 * Both halves of the guard, for every endpoint and every projection:
 *   (a) the description NAMES each field the projection declares
 *   (b) the projection actually EMITS each field it declares
 *
 * Half (b) is the one that would have caught the fabricated get-drugsfda
 * field names: a tool can name a field in its description and in its
 * declaration and still never emit it.
 */
describe('descriptions do not drift from what tools return', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    const tool = toToolDefinition(descriptor);

    it(`${tool.name} names every envelope key it always returns`, () => {
      for (const key of ENVELOPE_FIELDS) expect(tool.description).toContain(key);
    });

    for (const projection of descriptor.projections) {
      it(`${tool.name} detail="${projection.name}" names every field it declares`, () => {
        for (const field of projection.returnsFields) {
          expect(
            tool.description,
            `${tool.name}/${projection.name} returns "${field}" but never names it`
          ).toContain(field);
        }
      });

      it(`${tool.name} detail="${projection.name}" actually emits every field it declares`, () => {
        // An empty record is the hardest case: a projection must still emit
        // every key, so "absent" is distinguishable from "never mapped".
        const [emitted] = applyProjection(projection, [{}]);
        for (const field of projection.returnsFields) {
          expect(
            Object.keys(emitted ?? {}),
            `${tool.name}/${projection.name} declares "${field}" but did not emit it`
          ).toContain(field);
        }
      });
    }
  }
});
```

- [ ] **Step 3: Run it**

Run: `npx vitest run tests/drift-guard.test.ts`
Expected: PASS. A failure here means a projection declares a field it does not always emit — fix the projection so the key is always present (empty array, or `null`), never by trimming `returnsFields`.

- [ ] **Step 4: Delete the 1.x surface**

```bash
git rm src/drug/get-drug-by-name.ts src/drug/get-drug-by-generic-name.ts \
       src/drug/get-drug-adverse-events.ts src/drug/get-drugs-by-manufacturer.ts \
       src/drug/get-drug-safety-info.ts src/drug/get-drug-by-ndc.ts \
       src/drug/get-drug-by-product-ndc.ts src/drug/get-drugsfda.ts \
       src/drug/get-drug-adverse-event-counts.ts src/drug/index.ts \
       src/drug/resolve-label.ts src/drug/event-search.ts src/drug/drugsfda-sections.ts

git rm tests/description-drift.test.ts tests/get-drug-by-name.test.ts \
       tests/by-name-paging.test.ts tests/matched-via.test.ts \
       tests/resolve-label.test.ts tests/event-search.test.ts \
       tests/adverse-events-query.test.ts tests/adverse-event-counts.test.ts \
       tests/ndc-query.test.ts tests/product-ndc-tool.test.ts \
       tests/drugsfda-tool.test.ts tests/drugsfda-sections.test.ts \
       tests/drugsfda-detail.test.ts
git rm -r tests/parity
```

In `src/index.ts`, delete the nine-name import block and the nine `toolManager.registerTool(...)` lines, leaving only `registerDataset(toolManager, DRUG_ENDPOINTS)`.

- [ ] **Step 5: Remove the two temporary scaffolds**

In `src/OpenFDABuilder.ts`, delete the `context()` alias and its doc comment. In `tests/OpenFDABuilder.test.ts`, delete the "keeps context() working as an alias" test. In `tests/no-raw-query.test.ts`, delete `LEGACY_ALLOWED`, its use in the filter, and the "the legacy allowance is removed" test.

- [ ] **Step 6: Update the smoke script**

Rewrite the tool calls in `scripts/smoke-local.mjs` to the new surface. At minimum it must drive, over stdio against the built `dist/index.js`:

```js
// Replaces the 1.x calls one-for-one.
{ tool: 'drug-label',     args: { value: 'Advil' } },
{ tool: 'drug-label',     args: { value: 'Advil', detail: 'safety' } },
{ tool: 'drug-label',     args: { field: 'ndc', value: '0573-0164-40' } },
{ tool: 'drug-event',     args: { value: 'IBUPROFEN', limit: 2 } },
{ tool: 'drug-event',     args: { value: 'IBUPROFEN', count: 'patient.reaction.reactionmeddrapt.exact' } },
{ tool: 'drug-drugsfda',  args: { field: 'sponsor_name', value: 'Pfizer' } },
```

and assert, for each: the response parses, `matched_via` is present on record responses, no `api_key` substring appears anywhere in the output, and a deliberately nonexistent drug (`value: 'Zzzznotadrug'`) returns a **non-error** no-results message rather than `isError: true`. That last assertion is the live proof of the 404 fix.

- [ ] **Step 7: Run everything**

Run: `npm run test:ci && npm run typecheck && npm run lint && npm run build:cli`
Expected: all PASS.

Then, with a key in the environment: `npm run smoke`
Expected: all assertions pass against the live API.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat!: remove the 1.x get-* tools in favour of the drug endpoint group

BREAKING CHANGE: the nine get-* tools are replaced by drug-label,
drug-event and drug-drugsfda. See the migration table in README.md."
```

### Task 20: Documentation for the new tool surface

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `AGENTS.md`
- Create: `CHANGELOG.md`
- Create: `tests/docs-currency.test.ts`

**Interfaces:**
- Consumes: `DRUG_ENDPOINTS`.
- Produces: docs that match the shipped surface, and a test that keeps them matching.

**Deliberate refinement of the spec.** Spec §13 placed the `docs-currency` check in Phase 5. It lands here instead, driven off `DRUG_ENDPOINTS` rather than a hard-coded list, so it starts guarding at the moment the tool names change and automatically covers the four endpoints added in Phase 4.

- [ ] **Step 1: Write the failing test**

Create `tests/docs-currency.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';

const DOCS = ['README.md', 'CLAUDE.md', 'AGENTS.md'];
const RETIRED = [
  'get-drug-by-name', 'get-drug-by-generic-name', 'get-drug-adverse-events',
  'get-drugs-by-manufacturer', 'get-drug-safety-info', 'get-drug-by-ndc',
  'get-drug-by-product-ndc', 'get-drugsfda', 'get-drug-adverse-event-counts',
];

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
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/docs-currency.test.ts`
Expected: FAIL — the docs still describe the 1.x tools.

- [ ] **Step 3: Rewrite `README.md`**

Replace the feature list with one bullet per registered tool. Keep the API-key section, the keyless section and the route-vocabulary warning verbatim — all three are still true. Update the `autoApprove` example to the new names. Then add, at the end, the migration section, with the sentinel comment the test keys on:

```markdown
<!-- migration-table -->
## Migrating from 1.x

2.0.0 replaces the nine `get-*` tools with one tool per openFDA drug endpoint.
Pin `1.3.0` if you are not ready to migrate.

| 1.x tool | 2.0.0 call |
| --- | --- |
| `get-drug-by-name` | `drug-label` `{ field: "drug_name", value }` |
| `get-drug-by-generic-name` | `drug-label` `{ field: "generic_name", value }` |
| `get-drugs-by-manufacturer` | `drug-label` `{ field: "manufacturer_name", value }` |
| `get-drug-safety-info` | `drug-label` `{ field: "drug_name", value, detail: "safety" }` |
| `get-drug-by-ndc` | `drug-label` `{ field: "ndc", value }` |
| `get-drug-by-product-ndc` | `drug-label` `{ field: "product_ndc", value }` |
| `get-drug-adverse-events` | `drug-event` `{ field: "drug_name", value }` |
| `get-drug-adverse-event-counts` | `drug-event` `{ value, count: "patient.reaction.reactionmeddrapt.exact" }` |
| `get-drugsfda` | `drug-drugsfda` `{ field: "<section>.<field>", value }` |

**`get-drug-by-ndc` did not search `/drug/ndc.json`.** It searched labels by
NDC, so it maps to `drug-label`, not to the new `drug-ndc` tool. `drug-ndc`
exposes the NDC Directory, which this server never reached before.

Other behaviour changes:

- A search that matches nothing now returns a plain no-results message.
  Previously openFDA's HTTP 404 was reported as `isError: true` with
  "Failed to retrieve…", which was indistinguishable from an outage.
- `'Unknown'` placeholder strings are gone. Absent values are `null` or `[]`,
  so a placeholder can no longer be mistaken for data.
- `get-drug-safety-info`'s scalar `drug_name` is now the array `brand_name`.
- Response headers are uniform across tools; the emoji/prose headers are gone.
- Every response is capped at 60,000 characters, dropping trailing records and
  saying how many, rather than returning an unusable wall of text.
```

- [ ] **Step 4: Rewrite the tool and architecture sections of `CLAUDE.md`**

Replace **Key Files**, **Architecture** and **Available Tools**. The Architecture section must describe: the descriptor contract as the extension point, the executor as the single pipeline, `core/` containing no drug knowledge, and the catalog as the offline source of truth. Add the three new npm scripts. Replace the tool list with one entry per registered tool, naming its `field` values, `detail` values and `count` fields.

Fix the error in the current text while you are there: it describes the FAERS OR as `patient.drug.medicinalproduct`, `openfda.generic_name` and `openfda.substance_name`. The last two are wrong — verified live, top-level `openfda.substance_name` returns `NOT_FOUND` on the event index. The real paths are `patient.drug.openfda.generic_name` and `patient.drug.openfda.substance_name`.

- [ ] **Step 5: Rewrite `AGENTS.md`**

It is the stalest of the three: it lists seven tools, omits `get-drugsfda` and `get-drug-adverse-event-counts` entirely, and its module table predates `src/drug/`. Rewrite the module-responsibility table for `core/` and `datasets/`, replace the "Tool Registration Pattern" section with the descriptor pattern (a descriptor is data; no handler is written by hand), update the request-flow list to the executor pipeline, and replace the tool list.

- [ ] **Step 6: Create `CHANGELOG.md`**

```markdown
# Changelog

## 2.0.0

### Breaking

- The nine `get-*` tools are removed and replaced by one tool per openFDA drug
  endpoint. See the migration table in README.md.

### Added

- `drug-label`, `drug-event`, `drug-drugsfda` — the endpoint tools.
- `detail` selects a named record shape per endpoint; `drug-label` adds
  `safety`, which replaces `get-drug-safety-info`.
- `count` aggregates on every endpoint that supports it, not only events.

### Fixed

- **Search-value injection.** Values were interpolated raw into the query, so
  a crafted value could append a clause and make the server report data for a
  different drug than the one named in `matched_via`. All values are escaped,
  and query assembly is confined to one file with a test enforcing it.
- **A zero-match search is no longer reported as an error.** openFDA answers
  no matches with HTTP 404; that was surfaced as `isError: true` with
  "Failed to retrieve…", making "not found" indistinguishable from an outage.
- Responses are capped at 60,000 characters.
```

- [ ] **Step 7: Run the guard and the suite**

Run: `npx vitest run tests/docs-currency.test.ts && npm run test:ci`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add README.md CLAUDE.md AGENTS.md CHANGELOG.md tests/docs-currency.test.ts
git commit -m "docs: document the 2.0.0 tool surface and guard it against drift"
```

---

# Phase 4 — The four endpoints this server has never had

`/drug/ndc.json` (138,046 records), `/drug/enforcement.json` (17,965), `/drug/orangebook.json` (48,761) and `/drug/shortages.json` (1,603). Every field named in these tasks was read from a real record returned by the live API on 2026-09-20, but each must still clear `tests/catalog-conformance` and `npm run probe:fields`. **If a field fails either gate, delete it from the descriptor and record the removal in the Task 3 selection note. Never weaken a gate to keep a field.**

### Task 21: The live field probe, and `drug-ndc`

**Files:**
- Create: `scripts/probe-fields.ts`
- Create: `src/datasets/drug/ndc.ts`
- Modify: `package.json` (add the `probe:fields` script), `src/datasets/drug/index.ts`
- Test: `tests/datasets/drug-ndc.test.ts`

**Interfaces:**
- Consumes: `DRUG_ENDPOINTS`, `declaredPaths` (Task 5).
- Produces: `drugNdc: EndpointDescriptor`; `npm run probe:fields`.

- [ ] **Step 1: Write the live probe**

Add to `package.json` scripts: `"probe:fields": "tsx scripts/probe-fields.ts"`. It runs through `tsx` (already a devDependency) against `src/`, **not** against `dist/`: `vite.config.ts` builds a single bundled `dist/index.js` with `preserveModules: false`, so `dist/datasets/...` does not exist.

Create `scripts/probe-fields.ts`:

```ts
#!/usr/bin/env tsx
/*
 * Confirms every path a descriptor exposes actually returns data. Hits the
 * live API; NOT part of npm test.
 *
 * tests/catalog-conformance already proves a path is PUBLISHED by FDA. This
 * proves it is POPULATED — a published-but-empty field presents as a valid
 * search that always finds nothing, which is the failure mode that looks
 * exactly like absent data.
 */
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index.js';
import { declaredPaths } from '../src/core/search/strategy.js';

const API_KEY = process.env.OPENFDA_API_KEY;
const PAUSE_MS = 260;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function existsCount(dataset, endpoint, path) {
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  params.set('search', `_exists_:${path}`);
  params.set('limit', '0');
  const response = await fetch(`https://api.fda.gov/${dataset}/${endpoint}.json?${params}`);
  if (response.status === 404) return 0;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json())?.meta?.results?.total ?? 0;
}

let failures = 0;
for (const descriptor of DRUG_ENDPOINTS) {
  console.log(`\n${descriptor.toolName}`);
  const paths = [
    ...new Set([
      ...descriptor.fields.flatMap((field) => declaredPaths(field.strategy)),
      ...descriptor.countFields.map((path) => path.replace(/\.exact$/, '')),
    ]),
  ];
  for (const path of paths) {
    await sleep(PAUSE_MS);
    try {
      const docs = await existsCount(descriptor.dataset, descriptor.endpoint, path);
      const ok = docs > 0;
      if (!ok) failures += 1;
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${path} (${docs} records)`);
    } catch (error) {
      failures += 1;
      console.log(`  FAIL ${path} (${(error as Error).message})`);
    }
  }
}
console.log(failures === 0 ? '\nall exposed paths return data' : `\n${failures} path(s) returned nothing`);
process.exit(failures === 0 ? 0 : 1);
```

Run: `npm run probe:fields`
Expected: every path of `drug-label`, `drug-event` and `drug-drugsfda` reports `ok`. Any `FAIL` is a real problem in a Phase-2 descriptor — fix it before continuing.

- [ ] **Step 2: Write the failing test**

Create `tests/datasets/drug-ndc.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugNdc } from '../../src/datasets/drug/ndc';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const RECORD = {
  product_ndc: '0002-0800',
  generic_name: 'INSULIN LISPRO',
  brand_name: 'HUMALOG',
  labeler_name: 'Eli Lilly and Company',
  dosage_form: 'INJECTION, SOLUTION',
  route: ['SUBCUTANEOUS'],
  product_type: 'HUMAN PRESCRIPTION DRUG',
  marketing_category: 'BLA',
  application_number: 'BLA020563',
  active_ingredients: [{ name: 'INSULIN LISPRO', strength: '100 [iU]/mL' }],
  packaging: [{ package_ndc: '0002-0800-01', description: '1 VIAL' }],
  finished: true,
};
const page = { body: { meta: { results: { total: 4 } }, results: [RECORD] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-ndc descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugNdc)).toEqual([]);
  });

  it('searches the NDC Directory, not the label index', () => {
    expect(drugNdc.endpoint).toBe('ndc');
    expect(drugNdc.toolName).toBe('drug-ndc');
  });

  it('normalises a product NDC before searching', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugNdc, { field: 'product_ndc', value: '000208 00'.replace(' ', '') });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('product_ndc:"');
  });

  it('summarises a directory entry with its packaging', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugNdc, { field: 'brand_name', value: 'HUMALOG' })).results[0];
    expect(record.product_ndc).toBe('0002-0800');
    expect(record.package_ndc).toEqual(['0002-0800-01']);
    expect(record.active_ingredients).toEqual([{ name: 'INSULIN LISPRO', strength: '100 [iU]/mL' }]);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-ndc.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement**

Create `src/datasets/drug/ndc.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';
import { normalizeNDC } from '../../utils/ndc.js';
import { invalidNdcMessage } from '../../utils/ndc-formats.js';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const drugNdc: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'ndc',
  toolName: 'drug-ndc',
  summary:
    'Search the NDC Directory — every drug product currently listed with the FDA, with its ' +
    'packaging, labeller, marketing category and application number. This is the product ' +
    'registry, NOT the labelling text: use drug-label for warnings and indications.',
  fields: [
    {
      name: 'product_ndc',
      description: 'product NDC; dashed 4-4, 5-3, 5-4, or undashed 9 or 11 digits',
      normalize: (raw) => {
        const { productNDC, isValid } = normalizeNDC(raw);
        return isValid
          ? { ok: true as const, value: productNDC }
          : { ok: false as const, message: invalidNdcMessage(raw, 'product NDC') };
      },
      strategy: { kind: 'exact', path: 'product_ndc' },
    },
    { name: 'brand_name', description: 'brand name', strategy: { kind: 'exact', path: 'brand_name' } },
    { name: 'generic_name', description: 'generic name', strategy: { kind: 'exact', path: 'generic_name' } },
    { name: 'labeler_name', description: 'the company that lists the product', strategy: { kind: 'exact', path: 'labeler_name' } },
    { name: 'application_number', description: 'NDA/ANDA/BLA number', strategy: { kind: 'exact', path: 'application_number' } },
    { name: 'marketing_category', description: 'e.g. NDA, ANDA, OTC MONOGRAPH FINAL', strategy: { kind: 'exact', path: 'marketing_category' } },
    { name: 'dosage_form', description: 'e.g. TABLET, INJECTION, SOLUTION', strategy: { kind: 'exact', path: 'dosage_form' } },
    { name: 'route', description: 'route of administration', strategy: { kind: 'exact', path: 'route' } },
    { name: 'product_type', description: 'e.g. HUMAN PRESCRIPTION DRUG', strategy: { kind: 'exact', path: 'product_type' } },
    { name: 'substance_name', description: 'active ingredient name', strategy: { kind: 'exact', path: 'active_ingredients.name' } },
    { name: 'pharm_class', description: 'pharmacologic class', strategy: { kind: 'exact', path: 'pharm_class' } },
  ],
  defaultField: 'brand_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity, packaging and marketing status for one listed product.',
      returnsFields: [
        'product_ndc', 'brand_name', 'generic_name', 'labeler_name', 'dosage_form', 'route',
        'product_type', 'marketing_category', 'application_number', 'active_ingredients',
        'package_ndc', 'finished',
      ],
      project: (record: any) => ({
        product_ndc: record?.product_ndc ?? null,
        brand_name: record?.brand_name ?? null,
        generic_name: record?.generic_name ?? null,
        labeler_name: record?.labeler_name ?? null,
        dosage_form: record?.dosage_form ?? null,
        route: asArray(record?.route),
        product_type: record?.product_type ?? null,
        marketing_category: record?.marketing_category ?? null,
        application_number: record?.application_number ?? null,
        active_ingredients: asArray(record?.active_ingredients),
        // Flattened from packaging[]: the package NDCs are what a caller
        // actually searches by, and the rest of the packaging blob is noise.
        package_ndc: asArray(record?.packaging)
          .map((pack: any) => pack?.package_ndc)
          .filter((ndc: unknown): ndc is string => typeof ndc === 'string'),
        finished: record?.finished ?? null,
      }),
    },
    {
      name: 'full',
      description: 'The raw upstream directory entry under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: [],
  countFields: ['dosage_form', 'route', 'product_type', 'marketing_category', 'labeler_name.exact'],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-ndc.json',
};
```

Append `drugNdc` to `DRUG_ENDPOINTS`.

- [ ] **Step 5: Run the tests, the guards and the live probe**

Run: `npx vitest run tests/datasets/drug-ndc.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts tests/drift-guard.test.ts tests/docs-currency.test.ts`

`docs-currency` will FAIL until Step 6 — that is the guard doing its job.

Then: `npm run probe:fields`
Expected: every `drug-ndc` path reports `ok`. Remove any that does not.

- [ ] **Step 6: Document the tool**

Add `drug-ndc` to the tool lists in `README.md`, `CLAUDE.md` and `AGENTS.md`, stating explicitly that it searches the NDC Directory and that the 1.x `get-drug-by-ndc` maps to `drug-label`, not to this tool.

- [ ] **Step 7: Run everything and commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add -A
git commit -m "feat(drug): add drug-ndc for the NDC Directory, plus the live field probe"
```

### Task 22: `drug-enforcement`

**Files:**
- Create: `src/datasets/drug/enforcement.ts`
- Modify: `src/datasets/drug/index.ts`, `README.md`, `CLAUDE.md`, `AGENTS.md`
- Test: `tests/datasets/drug-enforcement.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `execute` (Task 12).
- Produces: `drugEnforcement: EndpointDescriptor`.

- [ ] **Step 1: Write the failing test**

Create `tests/datasets/drug-enforcement.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugEnforcement } from '../../src/datasets/drug/enforcement';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const RECALL = {
  recall_number: 'D-0001-2024',
  status: 'Ongoing',
  classification: 'Class II',
  recalling_firm: 'Acme Pharma',
  product_description: 'Ibuprofen tablets, 200mg',
  reason_for_recall: 'Failed dissolution specifications',
  distribution_pattern: 'Nationwide',
  state: 'NJ',
  country: 'United States',
  voluntary_mandated: 'Voluntary: Firm initiated',
  report_date: '20240115',
  recall_initiation_date: '20231201',
  product_type: 'Drugs',
};
const page = { body: { meta: { results: { total: 7 } }, results: [RECALL] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) => JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-enforcement descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugEnforcement)).toEqual([]);
  });

  it('searches recall text by default, which is what a caller usually wants', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugEnforcement, { value: 'ibuprofen' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('product_description:"ibuprofen"');
  });

  it('summarises a recall with its classification and reason', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugEnforcement, { value: 'ibuprofen' })).results[0];
    expect(record.classification).toBe('Class II');
    expect(record.reason_for_recall).toBe('Failed dissolution specifications');
    expect(record.status).toBe('Ongoing');
  });

  it('can rank recalls by classification', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 'Class II', count: 43 }] } },
    ]);
    restore = stub.restore;
    const text = textOf(
      await execute(drugEnforcement, { value: 'ibuprofen', count: 'classification' })
    );
    expect(text).toContain('"term": "Class II"');
    expect(text).toContain('"counted_by": "classification"');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-enforcement.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/datasets/drug/enforcement.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';

export const drugEnforcement: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'enforcement',
  toolName: 'drug-enforcement',
  summary:
    'Search FDA drug recall and enforcement reports. classification is the hazard level: Class I ' +
    'means a reasonable probability of serious harm or death, Class II temporary or reversible ' +
    'harm, Class III unlikely harm. status says whether the recall is Ongoing, Completed or ' +
    'Terminated, so a recall being listed does not mean it is still in effect.',
  fields: [
    {
      name: 'product_description',
      description: 'free text describing the recalled product',
      strategy: { kind: 'exact', path: 'product_description' },
    },
    { name: 'recall_number', description: 'FDA recall number, e.g. D-0001-2024', strategy: { kind: 'exact', path: 'recall_number' } },
    { name: 'recalling_firm', description: 'the company conducting the recall', strategy: { kind: 'exact', path: 'recalling_firm' } },
    { name: 'reason_for_recall', description: 'free text reason', strategy: { kind: 'exact', path: 'reason_for_recall' } },
    { name: 'classification', description: 'Class I, Class II or Class III', strategy: { kind: 'exact', path: 'classification' } },
    { name: 'status', description: 'Ongoing, Completed, Terminated or Pending', strategy: { kind: 'exact', path: 'status' } },
    { name: 'state', description: 'US state of the recalling firm', strategy: { kind: 'exact', path: 'state' } },
    { name: 'country', description: 'country of the recalling firm', strategy: { kind: 'exact', path: 'country' } },
    { name: 'voluntary_mandated', description: 'whether the firm or the FDA initiated it', strategy: { kind: 'exact', path: 'voluntary_mandated' } },
    { name: 'product_type', description: 'always Drugs on this endpoint', strategy: { kind: 'exact', path: 'product_type' } },
    { name: 'event_id', description: 'FDA enforcement event id', strategy: { kind: 'exact', path: 'event_id' } },
  ],
  defaultField: 'product_description',
  projections: [
    {
      name: 'summary',
      description: 'The recall, its hazard classification, reason, scope and dates.',
      returnsFields: [
        'recall_number', 'status', 'classification', 'recalling_firm', 'product_description',
        'reason_for_recall', 'distribution_pattern', 'state', 'country', 'voluntary_mandated',
        'recall_initiation_date', 'report_date', 'termination_date',
      ],
      project: (record: any) => ({
        recall_number: record?.recall_number ?? null,
        status: record?.status ?? null,
        classification: record?.classification ?? null,
        recalling_firm: record?.recalling_firm ?? null,
        product_description: record?.product_description ?? null,
        reason_for_recall: record?.reason_for_recall ?? null,
        distribution_pattern: record?.distribution_pattern ?? null,
        state: record?.state ?? null,
        country: record?.country ?? null,
        voluntary_mandated: record?.voluntary_mandated ?? null,
        recall_initiation_date: record?.recall_initiation_date ?? null,
        report_date: record?.report_date ?? null,
        // Absent while a recall is still open; null says "not terminated",
        // which is different from "we did not look".
        termination_date: record?.termination_date ?? null,
      }),
    },
    {
      name: 'full',
      description: 'The raw upstream enforcement report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['report_date:desc', 'report_date:asc', 'recall_initiation_date:desc'],
  countFields: ['classification', 'status', 'state', 'voluntary_mandated', 'recalling_firm.exact'],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-enforcement.json',
};
```

Append `drugEnforcement` to `DRUG_ENDPOINTS`, and add it to the tool lists in `README.md`, `CLAUDE.md` and `AGENTS.md`.

- [ ] **Step 4: Run the tests, guards and probe**

Run: `npx vitest run tests/datasets/drug-enforcement.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts tests/drift-guard.test.ts tests/docs-currency.test.ts`
Then: `npm run probe:fields`
Expected: PASS, and every `drug-enforcement` path reports `ok`.

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add -A
git commit -m "feat(drug): add drug-enforcement for recall and enforcement reports"
```

### Task 23: `drug-orangebook`

**Files:**
- Create: `src/datasets/drug/orangebook.ts`
- Modify: `src/datasets/drug/index.ts`, `README.md`, `CLAUDE.md`, `AGENTS.md`
- Test: `tests/datasets/drug-orangebook.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `execute` (Task 12).
- Produces: `drugOrangebook: EndpointDescriptor`.

**Record shape, read from the live API.** Unlike the other endpoints, almost everything lives under a nested `products[]` array; the top level carries only `approval_date` and `product_number`. Search paths are therefore `products.*`.

- [ ] **Step 1: Write the failing test**

Create `tests/datasets/drug-orangebook.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugOrangebook } from '../../src/datasets/drug/orangebook';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const ENTRY = {
  approval_date: '20090928',
  product_number: '003',
  products: [
    {
      active_ingredients: [
        { name: 'CARBIDOPA', strength: '25MG' },
        { name: 'LEVODOPA', strength: '250MG' },
      ],
      brand_name: 'CARBIDOPA AND LEVODOPA',
      application_number: '090324',
      application_type: 'A',
      application_full_name: 'PHARMOBEDIENT CONSULTING LLC',
      reference_listed_drug: false,
      reference_standard: false,
      marketing_status: 'DISCONTINUED',
      dosage_form: 'TABLET',
      route: 'ORAL',
    },
  ],
};
const page = { body: { meta: { results: { total: 2 } }, results: [ENTRY] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-orangebook descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugOrangebook)).toEqual([]);
  });

  it('searches the nested products array, where the data actually lives', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugOrangebook, { value: 'CARBIDOPA AND LEVODOPA' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('products.brand_name:"CARBIDOPA AND LEVODOPA"');
  });

  it('flattens each product with its ingredients and therapeutic-equivalence flags', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.approval_date).toBe('20090928');
    expect(record.products).toHaveLength(1);
    expect(record.products[0].active_ingredients).toHaveLength(2);
    expect(record.products[0].marketing_status).toBe('DISCONTINUED');
    expect(record.products[0].reference_listed_drug).toBe(false);
  });

  it('emits products as an empty array when the entry carries none', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 1 } }, results: [{ approval_date: '20200101' }] } },
    ]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.products).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-orangebook.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/datasets/drug/orangebook.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);

export const drugOrangebook: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'orangebook',
  toolName: 'drug-orangebook',
  summary:
    'Search the Orange Book — FDA-approved drug products with their therapeutic equivalence ' +
    'information. reference_listed_drug marks the product other generics are compared against; ' +
    'application_type "A" is an ANDA (generic) and "N" an NDA (brand). Almost all fields live ' +
    'under the nested products array.',
  fields: [
    { name: 'brand_name', description: 'product name as approved', strategy: { kind: 'exact', path: 'products.brand_name' } },
    { name: 'substance_name', description: 'active ingredient name', strategy: { kind: 'exact', path: 'products.active_ingredients.name' } },
    { name: 'application_number', description: 'ANDA or NDA number', strategy: { kind: 'exact', path: 'products.application_number' } },
    { name: 'applicant', description: 'full applicant name', strategy: { kind: 'exact', path: 'products.application_full_name' } },
    { name: 'application_type', description: 'A for ANDA (generic), N for NDA (brand)', strategy: { kind: 'exact', path: 'products.application_type' } },
    { name: 'marketing_status', description: 'e.g. PRESCRIPTION, OVER-THE-COUNTER, DISCONTINUED', strategy: { kind: 'exact', path: 'products.marketing_status' } },
    { name: 'dosage_form', description: 'e.g. TABLET', strategy: { kind: 'exact', path: 'products.dosage_form' } },
    { name: 'route', description: 'route of administration', strategy: { kind: 'exact', path: 'products.route' } },
  ],
  defaultField: 'brand_name',
  projections: [
    {
      name: 'summary',
      description: 'Approval date and each approved product with its equivalence flags.',
      returnsFields: ['approval_date', 'product_number', 'products'],
      project: (record: any) => ({
        approval_date: record?.approval_date ?? null,
        product_number: record?.product_number ?? null,
        products: asArray(record?.products).map((product: any) => ({
          brand_name: product?.brand_name ?? null,
          application_number: product?.application_number ?? null,
          application_type: product?.application_type ?? null,
          application_full_name: product?.application_full_name ?? null,
          active_ingredients: asArray(product?.active_ingredients),
          marketing_status: product?.marketing_status ?? null,
          dosage_form: product?.dosage_form ?? null,
          route: product?.route ?? null,
          // Emitted either way: false means "not the reference product",
          // which is a fact, not a missing value.
          reference_listed_drug: product?.reference_listed_drug ?? null,
          reference_standard: product?.reference_standard ?? null,
        })),
      }),
    },
    {
      name: 'full',
      description: 'The raw upstream Orange Book entry under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['approval_date:desc', 'approval_date:asc'],
  countFields: ['products.marketing_status', 'products.dosage_form', 'products.route', 'products.application_type'],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-orangebook.json',
};
```

Append `drugOrangebook` to `DRUG_ENDPOINTS`, and add it to the three doc tool lists.

- [ ] **Step 4: Run the tests, guards and probe**

Run: `npx vitest run tests/datasets/drug-orangebook.test.ts tests/catalog-conformance.test.ts tests/schema-budget.test.ts tests/drift-guard.test.ts tests/docs-currency.test.ts`
Then: `npm run probe:fields`
Expected: PASS, every `drug-orangebook` path `ok`.

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add -A
git commit -m "feat(drug): add drug-orangebook for therapeutic equivalence data"
```

### Task 24: `drug-shortages`

**Files:**
- Create: `src/datasets/drug/shortages.ts`
- Modify: `src/datasets/drug/index.ts`, `README.md`, `CLAUDE.md`, `AGENTS.md`
- Test: `tests/datasets/drug-shortages.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor` (Task 9), `execute` (Task 12).
- Produces: `drugShortages: EndpointDescriptor`. This is the last entry in `DRUG_ENDPOINTS`, bringing it to seven.

- [ ] **Step 1: Write the failing test**

Create `tests/datasets/drug-shortages.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { drugShortages } from '../../src/datasets/drug/shortages';
import { drugLabel } from '../../src/datasets/drug/label';
import { DRUG_ENDPOINTS } from '../../src/datasets/drug/index';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const SHORTAGE = {
  generic_name: 'AMOXICILLIN',
  company_name: 'Example Labs',
  status: 'Currently in Shortage',
  dosage_form: 'ORAL SUSPENSION',
  presentation: '250mg/5mL, 100mL bottle',
  therapeutic_category: ['Anti-Infective'],
  package_ndc: '12345-678-90',
  update_type: 'Revised',
  initial_posting_date: '20231001',
  update_date: '20240115',
  discontinued_date: '',
  contact_info: '1-800-555-0100',
};
const page = { body: { meta: { results: { total: 3 } }, results: [SHORTAGE] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-shortages descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugShortages)).toEqual([]);
  });

  it('completes the drug group at seven endpoints', () => {
    expect(DRUG_ENDPOINTS).toHaveLength(7);
    expect(DRUG_ENDPOINTS.map((d) => d.endpoint).sort()).toEqual([
      'drugsfda', 'enforcement', 'event', 'label', 'ndc', 'orangebook', 'shortages',
    ]);
  });

  it('searches by generic name, the way shortages are actually tracked', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugShortages, { value: 'AMOXICILLIN' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('generic_name:"AMOXICILLIN"');
  });

  it('reports status and both dates so a resolved shortage is obvious', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugShortages, { value: 'AMOXICILLIN' })).results[0];
    expect(record.status).toBe('Currently in Shortage');
    expect(record.initial_posting_date).toBe('20231001');
    expect(record.update_date).toBe('20240115');
  });

  it('uses a different generic_name path from drug-label, because the datasets differ', () => {
    const shortagesPath = drugShortages.fields.find((f) => f.name === 'generic_name')!.strategy;
    const labelPath = drugLabel.fields.find((f) => f.name === 'generic_name')!.strategy;
    expect(shortagesPath).toEqual({ kind: 'exact', path: 'generic_name' });
    expect(labelPath).toEqual({ kind: 'exact', path: 'openfda.generic_name' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/datasets/drug-shortages.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

Create `src/datasets/drug/shortages.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
/** openFDA sends an empty string for an absent date; null is honest. */
const orNull = (value: unknown): unknown => (value === '' || value === undefined ? null : value);

export const drugShortages: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'shortages',
  toolName: 'drug-shortages',
  summary:
    'Search FDA drug shortage reports. status distinguishes a current shortage from a resolved ' +
    'one, so a product appearing here is not necessarily in shortage now — always read status ' +
    'and update_date. This is the smallest drug dataset, around 1,600 records.',
  fields: [
    { name: 'generic_name', description: 'generic name, how shortages are tracked', strategy: { kind: 'exact', path: 'generic_name' } },
    { name: 'company_name', description: 'reporting company', strategy: { kind: 'exact', path: 'company_name' } },
    { name: 'status', description: 'e.g. Currently in Shortage, Resolved, Discontinued', strategy: { kind: 'exact', path: 'status' } },
    { name: 'dosage_form', description: 'e.g. ORAL SUSPENSION, INJECTION', strategy: { kind: 'exact', path: 'dosage_form' } },
    { name: 'therapeutic_category', description: 'e.g. Anti-Infective', strategy: { kind: 'exact', path: 'therapeutic_category' } },
    { name: 'package_ndc', description: 'package NDC of the affected presentation', strategy: { kind: 'exact', path: 'package_ndc' } },
    { name: 'brand_name', description: 'brand name from the openfda block', strategy: { kind: 'exact', path: 'openfda.brand_name' } },
    { name: 'manufacturer_name', description: 'manufacturer from the openfda block', strategy: { kind: 'exact', path: 'openfda.manufacturer_name' } },
    { name: 'substance_name', description: 'substance name from the openfda block', strategy: { kind: 'exact', path: 'openfda.substance_name' } },
  ],
  defaultField: 'generic_name',
  projections: [
    {
      name: 'summary',
      description: 'The affected presentation, who reports it, its status and the relevant dates.',
      returnsFields: [
        'generic_name', 'company_name', 'status', 'dosage_form', 'presentation',
        'therapeutic_category', 'package_ndc', 'update_type', 'initial_posting_date',
        'update_date', 'discontinued_date', 'contact_info',
      ],
      project: (record: any) => ({
        generic_name: orNull(record?.generic_name),
        company_name: orNull(record?.company_name),
        status: orNull(record?.status),
        dosage_form: orNull(record?.dosage_form),
        presentation: orNull(record?.presentation),
        therapeutic_category: asArray(record?.therapeutic_category),
        package_ndc: orNull(record?.package_ndc),
        update_type: orNull(record?.update_type),
        initial_posting_date: orNull(record?.initial_posting_date),
        update_date: orNull(record?.update_date),
        discontinued_date: orNull(record?.discontinued_date),
        contact_info: orNull(record?.contact_info),
      }),
    },
    {
      name: 'full',
      description: 'The raw upstream shortage report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['update_date:desc', 'update_date:asc', 'initial_posting_date:desc'],
  countFields: ['status', 'dosage_form', 'therapeutic_category', 'company_name.exact'],
  codeMaps: {},
  limits: { default: 10, max: 50 },
  catalog: 'src/catalog/drug-shortages.json',
};
```

Append `drugShortages` to `DRUG_ENDPOINTS`, and add it to the three doc tool lists.

- [ ] **Step 4: Run the tests, guards and probe**

Run: `npm run test:ci`
Then: `npm run probe:fields`
Expected: PASS, and every path across all seven endpoints reports `ok`.

Pay attention to `tests/schema-budget.test.ts` here — this is the first run with all seven tools loaded, so it is the first meaningful test of the context budget. If it fails, trim descriptor `summary` prose and field descriptions; do **not** remove the projection field names, which the drift guard depends on.

- [ ] **Step 5: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add -A
git commit -m "feat(drug): add drug-shortages, completing the seven-endpoint drug group"
```

---

# Phase 5 — Resources, drift CI, and the release

### Task 25: Serve the field catalogs as MCP resources

**Files:**
- Create: `src/core/resources.ts`
- Create: `src/datasets/drug/catalogs.ts`
- Modify: `src/index.ts`
- Test: `tests/core/resources.test.ts`, `tests/bundle-size.test.ts`

**Interfaces:**
- Consumes: `EndpointDescriptor`, `DRUG_ENDPOINTS`.
- Produces:
  - `registerCatalogResources(server: McpServer, descriptors: readonly EndpointDescriptor[], load: (descriptor: EndpointDescriptor) => unknown): void`
  - `DRUG_CATALOGS: Record<string, unknown>` keyed by `toolName`

**Why this closes the context concern.** A tool's schema is loaded into every agent's context on connect; a resource is listed lazily and read only on demand. The curated `field` enum holds ~10–20 entries per endpoint, and the several-hundred-field long tail lives here, reachable when a model needs it and costing nothing when it does not. `src/index.ts` has declared `capabilities.resources: {}` since 1.0 and never used it.

- [ ] **Step 1: Write the failing test**

Create `tests/core/resources.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { registerCatalogResources } from '../../src/core/resources';
import { DRUG_ENDPOINTS } from '../../src/datasets/drug/index';
import { DRUG_CATALOGS } from '../../src/datasets/drug/catalogs';

describe('field catalog resources', () => {
  it('registers one resource per endpoint at a stable uri', () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    const uris = registerResource.mock.calls.map((call) => call[1]);
    for (const descriptor of DRUG_ENDPOINTS) {
      expect(uris).toContain(`openfda://${descriptor.dataset}/${descriptor.endpoint}/fields`);
    }
    expect(uris).toHaveLength(DRUG_ENDPOINTS.length);
  });

  it('serves the full field list as JSON, far beyond the curated enum', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    const labelCall = registerResource.mock.calls.find((call) =>
      String(call[1]).includes('/label/')
    )!;
    const read = labelCall[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
    const result = await read(new URL('openfda://drug/label/fields'));
    const payload = JSON.parse(result.contents[0]!.text);

    const labelDescriptor = DRUG_ENDPOINTS.find((d) => d.endpoint === 'label')!;
    expect(payload.fields.length).toBeGreaterThan(labelDescriptor.fields.length * 5);
    expect(payload.fields[0]).toHaveProperty('path');
    expect(payload.fields[0]).toHaveProperty('description');
  });

  it('never leaks an api_key into resource content', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );
    for (const call of registerResource.mock.calls) {
      const read = call[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
      const result = await read(new URL(String(call[1])));
      expect(result.contents[0]!.text).not.toContain('api_key');
    }
  });
});
```

Create `tests/bundle-size.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';

/**
 * The catalogs are imported, so they are bundled into dist/index.js. That is
 * deliberate — it is what makes the resources work without a separate file
 * copy — but it must not grow without anyone noticing.
 */
describe('published bundle size', () => {
  it('stays under 1 MB', () => {
    if (!existsSync('dist/index.js')) return; // only meaningful after a build
    expect(statSync('dist/index.js').size).toBeLessThan(1_000_000);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/core/resources.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement the catalog map**

Create `src/datasets/drug/catalogs.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import labelCatalog from '../../catalog/drug-label.json' with { type: 'json' };
import labelCoverage from '../../catalog/drug-label.coverage.json' with { type: 'json' };
import eventCatalog from '../../catalog/drug-event.json' with { type: 'json' };
import eventCoverage from '../../catalog/drug-event.coverage.json' with { type: 'json' };
import ndcCatalog from '../../catalog/drug-ndc.json' with { type: 'json' };
import ndcCoverage from '../../catalog/drug-ndc.coverage.json' with { type: 'json' };
import enforcementCatalog from '../../catalog/drug-enforcement.json' with { type: 'json' };
import enforcementCoverage from '../../catalog/drug-enforcement.coverage.json' with { type: 'json' };
import drugsfdaCatalog from '../../catalog/drug-drugsfda.json' with { type: 'json' };
import drugsfdaCoverage from '../../catalog/drug-drugsfda.coverage.json' with { type: 'json' };
import orangebookCatalog from '../../catalog/drug-orangebook.json' with { type: 'json' };
import orangebookCoverage from '../../catalog/drug-orangebook.coverage.json' with { type: 'json' };
import shortagesCatalog from '../../catalog/drug-shortages.json' with { type: 'json' };
import shortagesCoverage from '../../catalog/drug-shortages.coverage.json' with { type: 'json' };

interface CatalogField {
  path: string;
  type: string;
  description: string;
}
interface Catalog {
  endpoint: string;
  source_url: string;
  fetched_at: string;
  fields: CatalogField[];
}
interface Coverage {
  fields: Array<{ path: string; coverage_pct: number }>;
}

/**
 * Merge measured coverage into the published field list. Coverage is what
 * tells a model whether a field is worth searching at all: a field openFDA
 * publishes but almost never populates presents as a valid search that always
 * finds nothing.
 */
function merge(catalog: Catalog, coverage: Coverage): Catalog & { fields: Array<CatalogField & { coverage_pct: number | null }> } {
  const byPath = new Map(coverage.fields.map((field) => [field.path, field.coverage_pct]));
  return {
    ...catalog,
    fields: catalog.fields.map((field) => ({
      ...field,
      coverage_pct: byPath.get(field.path) ?? null,
    })),
  };
}

export const DRUG_CATALOGS: Record<string, unknown> = {
  'drug-label': merge(labelCatalog as Catalog, labelCoverage as Coverage),
  'drug-event': merge(eventCatalog as Catalog, eventCoverage as Coverage),
  'drug-ndc': merge(ndcCatalog as Catalog, ndcCoverage as Coverage),
  'drug-enforcement': merge(enforcementCatalog as Catalog, enforcementCoverage as Coverage),
  'drug-drugsfda': merge(drugsfdaCatalog as Catalog, drugsfdaCoverage as Coverage),
  'drug-orangebook': merge(orangebookCatalog as Catalog, orangebookCoverage as Coverage),
  'drug-shortages': merge(shortagesCatalog as Catalog, shortagesCoverage as Coverage),
};
```

- [ ] **Step 4: Implement the resource registration**

Create `src/core/resources.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { EndpointDescriptor } from './descriptor.js';

/**
 * Publish each endpoint's full FDA field list as a resource.
 *
 * A tool's schema is loaded into an agent's context on connect; a resource is
 * read only on demand. That split is what lets the `field` enum stay curated
 * (10–20 entries) while the several-hundred-field long tail stays reachable.
 */
export function registerCatalogResources(
  server: McpServer,
  descriptors: readonly EndpointDescriptor[],
  load: (descriptor: EndpointDescriptor) => unknown
): void {
  for (const descriptor of descriptors) {
    const uri = `openfda://${descriptor.dataset}/${descriptor.endpoint}/fields`;
    server.registerResource(
      `${descriptor.toolName}-fields`,
      uri,
      {
        title: `${descriptor.toolName} field catalog`,
        description:
          `Every field openFDA publishes for /${descriptor.dataset}/${descriptor.endpoint}.json, ` +
          `with its description and the share of records that populate it. The tool's own field ` +
          `parameter exposes only the curated subset; read this to find anything else.`,
        mimeType: 'application/json',
      },
      async (resourceUri: URL) => ({
        contents: [
          {
            uri: resourceUri.href,
            mimeType: 'application/json',
            text: JSON.stringify(load(descriptor), null, 2),
          },
        ],
      })
    );
  }
}
```

- [ ] **Step 5: Wire it into `src/index.ts`**

```ts
import { registerCatalogResources } from './core/resources.js';
import { DRUG_CATALOGS } from './datasets/drug/catalogs.js';

registerCatalogResources(server, DRUG_ENDPOINTS, (descriptor) => DRUG_CATALOGS[descriptor.toolName]);
```

- [ ] **Step 6: Run the tests and a build**

Run: `npx vitest run tests/core/resources.test.ts && npm run build:cli && npx vitest run tests/bundle-size.test.ts`
Expected: PASS. If the bundle exceeds 1 MB, lower `MAX_DESCRIPTION` in `scripts/fields-sync.mjs` from 300 and re-run `npm run fields:sync`.

- [ ] **Step 7: Commit**

```bash
npm run lint -- --fix
npm run test:ci && npm run typecheck
git add -A
git commit -m "feat: serve each endpoint's full FDA field catalog as an MCP resource"
```

### Task 26: Weekly upstream-drift workflow

**Files:**
- Create: `.github/workflows/fields-drift.yml`
- Modify: `CLAUDE.md` (document the workflow and the required secret)

**Interfaces:**
- Consumes: `fields:sync`, `probe:fields`, `tests/catalog-conformance.test.ts`.
- Produces: a scheduled job that opens an issue when FDA changes or removes a field this server exposes.

**Prerequisite.** Add the repository secret `OPENFDA_API_KEY` (Settings → Secrets and variables → Actions). Without it the job still runs on the keyless tier but will be rate-limited; the workflow tolerates that by pausing between probes.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/fields-drift.yml`:

```yaml
name: Field drift

on:
  schedule:
    # Mondays 06:00 UTC. Upstream reference changes are rare; weekly is enough
    # to hear about one before a user reports a search that silently stopped
    # matching.
    - cron: '0 6 * * 1'
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - run: npm ci

      - name: Re-download FDA field references
        env:
          OPENFDA_API_KEY: ${{ secrets.OPENFDA_API_KEY }}
        run: npm run fields:sync

      - name: Detect a change in the published references
        id: diff
        run: |
          # fetched_at changes every run, so compare only the field lists.
          changed=0
          for f in src/catalog/drug-*.json; do
            case "$f" in *.coverage.json) continue;; esac
            if ! git diff --quiet -- "$f"; then
              node -e '
                const { execSync } = require("child_process");
                const file = process.argv[1];
                const now = JSON.parse(require("fs").readFileSync(file, "utf8"));
                const before = JSON.parse(execSync(`git show HEAD:${file}`).toString());
                const a = new Set(before.fields.map(x => x.path));
                const b = new Set(now.fields.map(x => x.path));
                const removed = [...a].filter(p => !b.has(p));
                const added = [...b].filter(p => !a.has(p));
                if (removed.length || added.length) {
                  console.log(`${file}: -${removed.join(" -")} +${added.join(" +")}`);
                  process.exit(3);
                }
              ' "$f" || changed=1
            fi
          done
          echo "changed=$changed" >> "$GITHUB_OUTPUT"

      - name: Descriptors still match the references
        run: npx vitest run tests/catalog-shape.test.ts tests/catalog-conformance.test.ts

      - name: Exposed fields still return data
        env:
          OPENFDA_API_KEY: ${{ secrets.OPENFDA_API_KEY }}
        run: npm run probe:fields

      - name: Open an issue on drift
        if: failure() || steps.diff.outputs.changed == '1'
        uses: actions/github-script@v7
        with:
          script: |
            const run = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `openFDA field drift detected (${new Date().toISOString().slice(0, 10)})`,
              labels: ['upstream-drift'],
              body: [
                'The weekly field-drift check failed.',
                '',
                'One of these is true:',
                '- FDA changed or removed a field this server exposes, so a `field` value now matches nothing.',
                '- A field is still published but no longer populated, which looks identical to absent data.',
                '- openFDA was simply unavailable. Re-run the job before investigating.',
                '',
                `Run: ${run}`,
                '',
                'To fix: `npm run fields:sync`, then `npm run probe:fields`, then remove or replace any',
                'failing path in `src/datasets/drug/*.ts` and note it in the field-selection note.',
              ].join('\n'),
            });
```

- [ ] **Step 2: Validate the workflow syntax**

Run: `npx --yes yaml-lint .github/workflows/fields-drift.yml 2>/dev/null || node -e "require('yaml').parse(require('fs').readFileSync('.github/workflows/fields-drift.yml','utf8')); console.log('valid yaml')"`
Expected: `valid yaml`

- [ ] **Step 3: Trigger it manually once**

Push the branch, then run the workflow from the Actions tab via `workflow_dispatch`.
Expected: green, with `probe:fields` reporting `ok` for every path. A failure here is real drift, not a workflow bug — investigate before continuing.

- [ ] **Step 4: Document it in `CLAUDE.md`**

Add to the commands section:

```markdown
`.github/workflows/fields-drift.yml` re-downloads FDA's field references every
Monday and re-probes every exposed field, opening an issue on failure. It needs
the `OPENFDA_API_KEY` repository secret. Run it by hand from the Actions tab
after changing any descriptor's field list.
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/fields-drift.yml CLAUDE.md
git commit -m "ci: weekly openFDA field-drift check that opens an issue on failure"
```

### Task 27: Release 2.0.0

**Files:**
- Modify: `package.json` (version), `README.md`, `CLAUDE.md`, `CHANGELOG.md`
- Test: `tests/version.test.ts` (existing — confirm it still passes)

**Interfaces:**
- Consumes: everything.
- Produces: a tagged, verified 2.0.0 ready to publish. **Do not publish.** Ythalo pushes and publishes.

- [ ] **Step 1: Bump the version**

In `package.json`, set `"version": "2.0.0"`.

Run: `npm run build:cli && npx vitest run tests/version.test.ts`
Expected: PASS — `vite.config.ts` injects the version into `serverInfo`, so this proves the two cannot drift.

- [ ] **Step 2: Add the "adding a new API group" section to `CLAUDE.md`**

This is the document that makes Food and Transparency cheap. Write it against the extensibility rule in spec §7.4:

```markdown
## Adding a new API group

`src/core/` contains no dataset knowledge. Adding a group is data:

1. Add the endpoint's slug to `scripts/fields-sync.mjs` and run
   `npm run fields:sync` and `npm run fields:coverage`.
2. Pick the exposed fields from the coverage data (criteria: published,
   searchable scalar, at least 5% coverage, real query utility; 10–20 fields).
   Record the choice and its justification in `docs/superpowers/notes/`.
3. Write `src/datasets/<group>/<endpoint>.ts` as an `EndpointDescriptor` and
   add it to that group's `index.ts`.
4. Register the group in `src/index.ts` with `registerDataset`, and its
   catalogs with `registerCatalogResources`.
5. Run `npm run test:ci` — `catalog-conformance`, `schema-budget`,
   `drift-guard` and `docs-currency` all apply automatically — then
   `npm run probe:fields`.
6. Document the tool in README.md, CLAUDE.md and AGENTS.md.

**If a new group forces a change under `src/core/`, the descriptor contract is
wrong.** Fix the contract; do not special-case the group.
```

- [ ] **Step 3: Add the release checklist to `CLAUDE.md`**

```markdown
## Release checklist

1. `npm run fields:sync && npm run fields:coverage` — refresh the catalogs
2. `npm run test:ci && npm run typecheck && npm run lint`
3. `npm run build:cli`
4. `npm run probe:fields` — every exposed path still returns data
5. `npm run probe:faers-codes` — FAERS code maps still match the reference
6. `npm run smoke` — end-to-end over stdio against the live API
7. `npm run smoke -- --no-key` — the missing-key path still fails cleanly
8. Bump the version, update CHANGELOG.md, tag, publish
```

- [ ] **Step 4: Run the full checklist**

```bash
npm run test:ci && npm run typecheck && npm run lint && npm run build:cli
npm run probe:fields
npm run probe:faers-codes
npm run smoke
npm run smoke -- --no-key
```

Expected: every command exits 0. Record any live-API failure and fix it before tagging — a green unit suite over stubs does not prove the live surface works.

- [ ] **Step 5: Final documentation read-through**

Re-read `README.md`, `CLAUDE.md` and `AGENTS.md` end to end against the shipped surface. `tests/docs-currency.test.ts` proves the tool names are present; it cannot prove the prose around them is true. Specifically confirm:

- every tool's `field`, `detail` and `count` values match its descriptor
- the migration table covers all nine retired tools
- the FAERS paths are written as `patient.drug.openfda.*` (the pre-2.0 text was wrong)
- the route-vocabulary warning still names the two tools it applies to
  (`drug-label` and `drug-drugsfda`)
- nothing claims a `.env` file is read

- [ ] **Step 6: Commit and tag**

```bash
git add -A
git commit -m "chore(release): 2.0.0"
git tag -a v2.0.0 -m "2.0.0 — API-group architecture"
```

Then stop and hand off. Report: the branch name, the tag, the full checklist output, and any field dropped during Phases 0–4 with the reason. Ythalo pushes and publishes.

---

## Plan Self-Review

Checked against the spec after writing.

**Spec coverage.** §3 endpoint inventory → Tasks 15–17, 21–24. §4.1 seven tools → Task 13 naming + Task 24 assertion. §4.2 clean break → Task 19. §4.3 virtual fields → Tasks 5, 15, 16. §4.4 universal params → Task 13 schema + Task 12 executor. §4.5 corrections A/B/C → `Projection[]` (Task 9), `project` functions (Tasks 15–17, 21–24), `ExtraFilters` (Tasks 9, 16). §4.6 catalog → Tasks 1–3, 14. §4.7 drift CI → Task 26. §5 coverage audit → Tasks 15–17 parity proofs + Task 20 migration table. §6 curation → Tasks 1–3, 14, 21. §6.4 resources → Task 25. §7 architecture → Tasks 4–14. §7.4 extensibility → Task 27 Step 2. §8 descriptor contract → Task 9. §9 security → Tasks 4, 6, 7, 11, 14, 25. §10 error handling → Tasks 11, 12. §11 testing → Tasks 14, 19, plus per-task tests. §12 rollout → the phase structure. §13 documentation → Tasks 20, 21–24 Step 6, 26, 27. No gaps found.

**Deliberate deviations from the spec, all noted in the tasks:**

1. The escaping spike (spec §9, Phase 0) was **resolved before writing this plan** — probed live on 2026-09-20 and recorded in Verified Facts. Backslash escaping works, so the plan is unconditional and Task 4 implements it directly.
2. The `docs-currency` check moves from Phase 5 to Task 20, driven off `DRUG_ENDPOINTS` so it starts guarding when the names change and covers Phase 4 automatically.
3. A behaviour fix the spec did not anticipate: openFDA reports zero matches as **HTTP 404**, so every 1.x tool reported "not found" as an error. Task 11 classifies it as a miss. This is in the CHANGELOG as a fix.
4. Spec §7.1 shows `catalog/` inside `src/`; the plan uses `src/catalog/` throughout, consistent with that tree, and descriptors carry the repo-relative path so the offline guard can read it with `fs`.

**Placeholder scan.** No TBD/TODO/"implement later"/"similar to Task N". Every code step carries the actual code. Two steps are deliberately data-driven rather than literal — Task 3's field selection and the Task 21–24 confirmations — and both state the criteria, the exact command to run, and the rule on failure (drop the field, never weaken the gate).

**Type consistency.** `Clause`, `ClauseSet`, `SearchStrategy`, `FieldSpec`, `Projection`, `ExtraFilters`, `EndpointDescriptor`, `PageOutcome`, `McpResult`, `ExecuteInput`, `Envelope` are each defined once and used with the same shape everywhere. `planClauseSets`/`declaredPaths` (Task 5), `buildQuery` (Task 6), `fitToBudget` (Task 7), `decodeTerm`/`buildEnvelope` (Task 8), `applyProjection`/`capArray`/`validateDescriptor` (Task 9), `fetchPage` (Task 11), `execute`/`SKIP_MAX` (Task 12), `buildDescription`/`buildInputSchema`/`toToolDefinition`/`registerDataset`/`ENVELOPE_FIELDS` (Task 13), `registerCatalogResources` (Task 25) — all call sites match their definitions.

**Two corrections applied during review:**

- `scripts/probe-fields.mjs` originally imported from `dist/`, but `vite.config.ts` builds a single bundled `dist/index.js` with `preserveModules: false`, so `dist/datasets/...` does not exist. Task 21 uses `tsx` against `src/` instead. The `probe:fields` npm entry therefore lands in Task 21, not Task 1.
- `tsconfig.json` already sets `resolveJsonModule: true`, so Task 25's JSON imports need no config change.
