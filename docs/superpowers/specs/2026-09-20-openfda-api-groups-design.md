# OpenFDA MCP — API-Group Architecture (2.0.0)

**Date:** 2026-09-20
**Status:** Approved (design); implementation not started
**Supersedes:** `2026-04-03-tool-organization-design.md`
**Target release:** 2.0.0 (breaking)

## 1. Goal

Restructure the server around openFDA's own API groups. The `drug` group
becomes a namespace of seven endpoint tools — one per `/drug/*.json`
endpoint — driven by a single generic executor and a set of declarative
endpoint descriptors. Adding the Food or Transparency group afterwards must
be additive data, not another refactor.

Secondary goals, all of which fall out of the restructure:

- Reach the three drug endpoints the server has never exposed
  (`enforcement`, `orangebook`, `shortages`) plus the NDC Directory
  (`/drug/ndc.json`), which is *not* what `get-drug-by-ndc` searched.
- Make a fabricated field name structurally impossible, offline, in CI.
- Close the search-value injection hole that exists in every current tool.
- Keep the total tool-schema context cost bounded and CI-enforced.

## 2. Non-goals

- Food, Device, Transparency or any other group. They are the reason for the
  architecture, not part of this spec.
- A remote/HTTP transport. Stdio only, unchanged.
- Caching, persistence or a rate limiter.
- Backwards compatibility with the 1.x tool names. See §4.2.

## 3. Endpoint inventory

All seven verified live on 2026-09-20 (`limit=1`, HTTP 200), and all seven
have a published field reference:

| endpoint | records | field reference |
| --- | --- | --- |
| `/drug/label.json` | 262,883 | `open.fda.gov/fields/druglabel.yaml` |
| `/drug/event.json` | 20,692,690 | `drugevent.yaml` |
| `/drug/ndc.json` | 138,046 | `drugndc.yaml` |
| `/drug/enforcement.json` | 17,965 | `drugenforcement.yaml` |
| `/drug/drugsfda.json` | 29,335 | `drugsfda.yaml` |
| `/drug/orangebook.json` | 48,761 | `drugorangebook.yaml` |
| `/drug/shortages.json` | 1,603 | `drugshortages.yaml` |

Today the server reaches only `label`, `event` and `drugsfda`.

## 4. Decisions

### 4.1 Seven endpoint tools, not one dispatcher

`drug-label`, `drug-event`, `drug-ndc`, `drug-enforcement`, `drug-drugsfda`,
`drug-orangebook`, `drug-shortages`.

A single `drug` tool with an `endpoint` parameter would cost less context but
cannot tie the `field` enum to the chosen endpoint in one flat schema, moving
validation to runtime and weakening what the model can see. Seven tools keep
a real per-endpoint description and a real per-endpoint enum.

No `get-`/`search-` prefix: these both search and aggregate, so a verb would
mislead, and seven short names cost fewer tokens. Future groups read
`food-enforcement`, `device-recall` — the grouping is visible in the tool list.

**Context budget.** The nine current tools cost ~1.4–1.7k tokens of
description and parameter text. Seven endpoint tools with a ~15-field enum
each land near ~2.6k. The hazard is not the tool count but the enum: the
`druglabel` reference alone lists ~830 fields, which would be ~20k tokens of
schema. Therefore the exposed enum is curated (§6) and the long tail is served
as an MCP resource, which is not loaded into context. A `schema-budget` test
enforces the ceiling (§9).

### 4.2 Clean break at 2.0.0

The nine `get-*` tools are removed. No aliases, no legacy env flag. A
deprecation window would mean 16 tools in context — the exact cost this design
exists to control. Stale clients pin `1.3.0`; the README carries a
one-row-per-tool migration table (§10).

### 4.3 Domain knowledge survives as virtual fields

The four-tier name resolver, the three-index FAERS OR, and NDC normalization
are input-side intelligence that a plain endpoint layer would lose. They become
*virtual fields* in the field table, indistinguishable to the caller from a real
path, with `matched_via` reporting which real path actually matched. So
`resolve-label.ts` and `event-search.ts` become declarative strategies rather
than bespoke modules.

### 4.4 Universal parameters

Every endpoint tool accepts, with identical semantics defined once:

- `field` + `value` — the search
- `limit`, `skip` (capped at openFDA's 25,000), `sort` (per-endpoint enum)
- `count` — aggregate instead of returning records
- `detail` — a per-endpoint named projection (see §4.5)

Every endpoint returns the same envelope:
`{ matched_via, total, returned, limit, results }`, with `total: null` on
aggregated responses because openFDA omits one there.

### 4.5 Three corrections found by the coverage audit

The audit in §5 showed the universal parameter set as first drafted could not
express three existing behaviours. All three are folded in:

- **A. `detail` is a per-endpoint enum of named projections**, not a universal
  `summary | full`. `get-drug-by-name` returns `mapLabelFields` (9 narrative
  fields) and `get-drug-safety-info` returns `mapSafetyFields` (13 safety
  fields); those are different *views* of one record, not two verbosity levels.
  `drug-label` therefore offers `summary | safety | full`; other endpoints offer
  `summary | full`.
- **B. Projections are functions, not field lists.** `available_packages`,
  `matching_product_ndc`, the deduplicated `reactions`/`outcomes` pairs and
  `submission_count` are all derived, not selected.
- **C. Descriptors may declare endpoint-specific filters.** `seriousness` on
  `drug-event` is not universal; it belongs to that descriptor.

### 4.6 Field lists are downloaded, then curated, then enforced

FDA's published field reference is downloaded into a committed catalog. The
exposed subset is chosen from that catalog against stated criteria, including
measured coverage. An offline test fails if any descriptor names a path absent
from the catalog. See §6.

### 4.7 A weekly CI job watches for upstream drift

A scheduled workflow re-syncs the catalogs and probes the exposed fields,
opening an issue when a field disappears or the reference changes.

## 5. Coverage audit — every 1.x tool maps forward

| 1.x tool | 2.0.0 call | note |
| --- | --- | --- |
| `get-drug-by-name` | `drug-label` · `field: drug_name` (virtual, tiered) | |
| `get-drug-by-generic-name` | `drug-label` · `field: openfda.generic_name` | |
| `get-drugs-by-manufacturer` | `drug-label` · `field: openfda.manufacturer_name` | |
| `get-drug-safety-info` | `drug-label` · `field: drug_name`, `detail: safety` | correction A |
| `get-drug-by-ndc` | `drug-label` · `field: ndc` (virtual, clauses) | **not** `drug-ndc` |
| `get-drug-by-product-ndc` | `drug-label` · `field: product_ndc` (virtual) | correction B |
| `get-drug-adverse-events` | `drug-event` · `field: drug_name` (virtual, anyOf) | correction C |
| `get-drug-adverse-event-counts` | `drug-event` · `count: patient.reaction.reactionmeddrapt.exact` | |
| `get-drugsfda` | `drug-drugsfda` · `field: <full path>` | section+field collapse to one path |

**`get-drug-by-ndc` never queried `/drug/ndc.json`.** It searched *labels* by
`openfda.product_ndc` / `openfda.package_ndc`. The new `drug-ndc` tool exposes
the NDC Directory and is net-new capability. Both tools' descriptions must
state which dataset they search, or a model will choose wrongly.

**Deliberate output changes**, beyond the rename:

- `'Unknown'` string fallbacks in `get-drug-by-generic-name` and
  `get-drugs-by-manufacturer` become `null` / `[]`, matching the convention
  adopted in 1.3.0. `'Unknown'` is indistinguishable from real data.
- Bespoke prose headers (`✅ Product NDC "…" found with 3 package variation(s)`)
  become one uniform header produced by `summarizeResults()`.

Both are listed in the parity harness (§9) as expected diffs.

## 6. Field curation

### 6.1 Pipeline

```
npm run fields:sync       downloads open.fda.gov/fields/<endpoint>.yaml
                          -> catalog/drug-<endpoint>.json
                             { source_url, fetched_at, fields: [{path, type, description}] }

npm run fields:coverage   per catalog field: search=_exists_:<path>&limit=0
                          -> catalog/drug-<endpoint>.coverage.json
                             { path, docs, coverage_pct }

npm run probe:fields      live: _exists_ plus one real query per EXPOSED field
```

`fields:sync` and `fields:coverage` hit the live API and are manual, in the
same spirit as the existing probe scripts. Their outputs are committed, so
everything downstream of them runs offline.

### 6.2 Selection criteria

A field is exposed in a tool's enum only if it is published by FDA in the
catalog, is a searchable scalar (string, date or number — not a container
object), clears a coverage floor of 5% of records, and has genuine query
utility (identifier, name, classification, status or date). A field that
exists but is populated in a fraction of a percent of records is worse than
absent: it presents as a valid search that always finds nothing.

Selection is performed during Phase 0 from the committed coverage data, with
the chosen set and its justification recorded in the implementation plan.

**This spec deliberately does not enumerate the exposed fields for
`enforcement`, `orangebook`, `shortages` or `ndc`.** Naming fields that have
not been read out of FDA's own reference is precisely the failure this design
exists to prevent — 1.1.0 shipped six such names in `get-drugsfda`, all
plausible, none real, each returning nothing in a way that looked like absent
data. The fields carried over from existing tools (the `openfda.*` identity
fields, the label narrative fields, the FAERS paths, and the table in
`drugsfda-sections.ts`) are already live-verified and carry forward.

### 6.3 The offline guard

A Vitest test, no network, in CI: every path referenced anywhere in a
descriptor — `exact.path`, each `anyOf` and `tiered` path, every clause path,
every `sortFields` and `countFields` entry, every `codeMaps` key — must appear
in that endpoint's committed catalog. A trailing `.exact` is stripped before
lookup, since openFDA accepts it for aggregation but does not list it.

`applications_doc_id` fails the moment it is typed. This is the 1.1.0 guard,
moved from a manual live probe into CI.

### 6.4 Catalogs are also MCP resources

`openfda://drug/label/fields` and its six siblings serve the full field list
with FDA's descriptions and the measured coverage. Resources are listed lazily
and read on demand, so the ~830-field long tail is reachable at zero standing
context cost. The server already declares `capabilities.resources: {}` and has
never used it.

## 7. Architecture

### 7.1 Layout

```
src/
  core/                      dataset-agnostic; contains no drug knowledge
    descriptor.ts            EndpointDescriptor, FieldSpec, Projection
    registry.ts              descriptors -> registered MCP tools + resources
    executor.ts              the single request pipeline
    search/
      escape.ts              escapeSearchValue — the sole escaping point
      strategy.ts            exact | anyOf | tiered | clauses
    shape/
      envelope.ts            { matched_via, total, returned, limit, results }
      project.ts             named projections, array caps, *_truncated
      budget.ts              MAX_RESPONSE_CHARS
    codes.ts                 code-map registry for decoding count terms

  datasets/drug/
    index.ts                 DRUG_ENDPOINTS: EndpointDescriptor[]
    label.ts  event.ts  ndc.ts  enforcement.ts
    drugsfda.ts  orangebook.ts  shortages.ts
    strategies.ts            drug_name tiered (label), drug_name anyOf (event),
                             ndc / product_ndc clauses
    codes/faers.ts           existing verified maps, moved unchanged

  catalog/                   generated by fields:sync, committed
  utils/                     env.ts redact.ts ndc.ts format.ts — carried over
```

### 7.2 Pipeline

Every call, every endpoint, in this order:

```
input
  -> zod schema built from the descriptor
  -> resolve `field`: real path or virtual strategy
  -> strategy emits Clause[] (path + RAW value); never a query string
  -> executor escapes every value and assembles the one query string
  -> OpenFDABuilder(dataset, endpoint, search, limit, skip, sort, count)
  -> makeOpenFDARequest  (retry, backoff, timeout — unchanged)
  -> count ? decode terms via code registry : project(detail) + caps
  -> envelope -> budget check -> MCP result
```

### 7.3 Changes to existing code

1. `OpenFDABuilder` — `DatasetType = 'drug'` and the four-value `ContextType`
   become `dataset: string` / `endpoint: string`, supplied by the descriptor.
   URL assembly and the keyless `api_key` omission are untouched.
2. `ToolManager` — keeps the `checkApiKey()` chokepoint exactly as is, and
   gains a second: registration flows through the executor, so escaping,
   projection and budget rules cannot be bypassed by a future tool.
3. `src/drug/get-*.ts` — all nine deleted in Phase 3.

`ApiHandler`, `env.ts`, `redact.ts`, `ndc.ts`, `format.ts`, `label-fields.ts`
and `faers.ts` are carried over; the first five unchanged, the last two moved.

### 7.4 The extensibility test

Adding the Food group must touch `src/datasets/food/*` and `catalog/*` only,
with zero edits under `src/core/`. If Food forces a core change, the descriptor
type was wrong and is fixed then — not special-cased.

## 8. The descriptor contract

```ts
export interface EndpointDescriptor {
  dataset: string;                 // 'drug'   -> /drug/…
  endpoint: string;                // 'label'  -> …/label.json
  toolName: string;                // 'drug-label'
  summary: string;                 // head of the generated tool description
  fields: FieldSpec[];
  defaultField?: string;
  projections: Projection[];       // [0] is the default
  extraFilters?: ExtraFilters;
  sortFields: readonly string[];
  countFields: readonly string[];
  codeMaps: Record<string, Record<string, string>>;   // path -> code -> label
  limits: { default: number; max: number };
  catalog: string;                 // 'catalog/drug-label.json'
}

export interface FieldSpec {
  name: string;                    // what the caller passes as `field`
  strategy: SearchStrategy;
  description: string;
  uppercase?: boolean;             // sponsor_name is stored uppercase
  normalize?: (raw: string) =>
    | { ok: true; value: string }
    | { ok: false; message: string };
}

export type Clause = { path: string; value: string };   // value is RAW

export type SearchStrategy =
  | { kind: 'exact';   path: string }                   // path:"value"
  | { kind: 'anyOf';   paths: string[] }                // OR, one query
  | { kind: 'tiered';  paths: string[] }                // sequential, stop at first hit
  | { kind: 'clauses'; build: (value: string) =>
      | { clauses: Clause[]; op: 'OR' | 'AND'; matched_via: string }
      | { ok: false; message: string } };

export interface Projection {
  name: string;                                  // 'summary' | 'safety' | 'full'
  description: string;
  project: (record: any) => Record<string, unknown>;
  returnsFields: readonly string[];              // feeds the drift guard
}

export interface ExtraFilters {
  schema: z.ZodRawShape;                         // { seriousness: z.enum([...]) }
  toClauses: (input: any) => Clause[];           // ANDed with the main group
}
```

**Strategies never produce a query string.** This is the security design, not
a convenience: the executor is the only code that concatenates, and it escapes
every value on the way. A descriptor author has no seam through which to write
`` `${path}:"${value}"` ``. `tiered` is today's four label tiers, `anyOf` is
today's three-index FAERS OR, and `clauses` covers the NDC case where product
and package carry different normalized values.

**The executor always parenthesises the main clause group before ANDing
extra filters**, so the `(a OR b OR c) AND serious:1` binding bug that was
fixed by hand in `get-drug-adverse-events` cannot recur in any endpoint.

**Projections declare what they guarantee**, per projection rather than per
tool, which makes the existing drift guard strictly stronger: it will check
every endpoint × projection pair instead of nine tools.

## 9. Security

| concern | treatment |
| --- | --- |
| **Query injection** | Structural. Strategies emit `Clause[]`; the executor is the sole assembler and escapes every value. Today every tool interpolates a caller-controlled value raw — e.g. ``.search(`${resolved.path}:"${value}"`)`` in `get-drugsfda.ts:132` and `resolve-label.ts:45`. A value of `Advil" OR openfda.brand_name:"Tylenol` closes the quote and appends a clause; the tool then reports a `matched_via` and a total, and the agent presents Tylenol data as an answer about Advil. Silent wrong-drug output, reachable from any untrusted string an agent passes through. |
| **Escaping semantics** | Phase-0 spike. If openFDA honours `\"` inside a quoted phrase, escape backslash then quote. If it does not, reject values containing `"` with an actionable message. Decision rule fixed in advance; either outcome makes it impossible for a value to alter query structure. |
| **API key** | `checkApiKey()` chokepoint and `redactApiKey()` carry over unchanged. The `no-url-in-output` guard extends to resource content, not only tool output. |
| **Output budget** | `MAX_RESPONSE_CHARS` in `core/shape/budget.ts`, enforced centrally. Makes the 71,393-character drugsfda response structurally unrepeatable, and closes a context-exhaustion path where one pathological upstream record floods an agent. |
| **URL construction** | `dataset` and `endpoint` come only from descriptors, a closed compile-time set. No caller input reaches the URL path — only escaped query values. |
| **Untrusted upstream text** | Label narrative is third-party prose flowing into an LLM context. It cannot be sanitised without destroying it; projections and the budget cap bound the blast radius. Stated honestly in the README rather than ignored. |
| **Supply chain** | Publish with `npm publish --provenance` from CI; keep dependencies pinned. |

## 10. Error handling

Four outcomes that must never be conflated:

1. **Configuration** — missing key. `checkApiKey()` chokepoint, before the
   network. Unchanged from 1.3.0.
2. **Input** — unknown field, invalid NDC, `skip > 25000`, unescapable value.
   Validated *before* any request, `isError: true`, and the message lists what
   is valid, generated from the descriptor. A typo must never be
   indistinguishable from absent data.
3. **Upstream** — `ApiHandler`'s existing categories (`network`, `http`,
   `parsing`, `timeout`, `empty_response`), with retry and backoff unchanged.
4. **No results** — *not* an error. No `isError`. States what was searched
   (for `tiered`, the tier list in order) plus suggestions, as
   `notFoundMessage()` does today.

One behaviour currently implicit is made explicit: in a `tiered` strategy, a
tier that *errors* differs from a tier that *misses*. All tiers missing is
outcome 4; any tier erroring with no hit anywhere is outcome 3. This is what
`resolveLabel`'s `lastError` already does, promoted to a deliberate rule.

## 11. Testing

Kept: every test of a surviving unit — `ndc`, `faers`, `format`, `redact`,
`env`, `ApiHandler`, `label-fields`, and the resolver tiers.

New guards, all offline and in CI:

| guard | catches |
| --- | --- |
| catalog conformance | descriptor path absent from the committed catalog — the 1.1.0 fabrication class, without network |
| schema budget | total serialized tool schemas over the ceiling |
| drift guard v2 | per endpoint × projection: every `returnsFields` key named in the description *and* actually emitted |
| no raw query assembly | any `:"` template literal outside `core/search/` |
| no-url-in-output | extended to resource content |
| descriptor completeness | ≥1 projection, valid `defaultField`, `codeMaps` keys ⊆ `countFields`, sane limits |
| escaping units | quotes, backslashes, Lucene operators, unicode |
| executor units | filter parenthesisation, skip ceiling, budget cap, count decoding, tiered stop-at-first-hit |

**Parity harness.** During Phase 2, a test drives each 1.x tool and its 2.0.0
equivalent against the same fixture and diffs the payloads. Any difference must
be deliberate and listed (§5). This turns "did we lose anything?" from a
judgement call into a test run, and is what makes a clean break safe.

Manual and live, unchanged in spirit: `probe:fields`, `probe:faers-codes`, and
`smoke` extended to all seven tools. `capture-fixtures.mjs` extended to the
four new endpoints.

## 12. Rollout

| phase | work | ships |
| --- | --- | --- |
| **0 — spikes** | Probe openFDA escaping semantics. Run `fields:sync` + `fields:coverage` for all seven; commit catalogs; record the exposed-field selection and its justification. | no |
| **1 — core** | `src/core/` complete with tests, nothing registered. Old tools untouched and working. | no |
| **2 — port** | Descriptors for `label`, `event`, `drugsfda`. Parity harness green. | no |
| **3 — cut over** | Delete the nine old tools; register the three new ones. | 2.0.0-rc |
| **4 — net-new** | `drug-ndc`, `drug-enforcement`, `drug-orangebook`, `drug-shortages`. | 2.0.0-rc |
| **5 — finish** | Field-catalog resources, weekly drift workflow, documentation (§13). | **2.0.0** |

Phases 1 and 2 are the risky ones and ship nothing, deliberately: `main` stays
publishable throughout. Phase 4 is where capability actually grows — it roughly
doubles the data reachable from this server.

## 13. Documentation

Documentation changes land in the same phase as the code they describe, not
ahead of it. Docs that describe unshipped behaviour are worse than stale docs,
because they read as ground truth.

**Phase 3** (tool surface changes):

- `README.md` — replace the feature list with the seven endpoint tools; add
  the **1.x → 2.0.0 migration table** from §5, one row per removed tool,
  including the `get-drug-by-ndc` / `drug-ndc` distinction; update the
  `autoApprove` example to the new names; keep the route-vocabulary warning,
  restated per endpoint.
- `CLAUDE.md` — rewrite **Key Files** and **Architecture** for `core/` and
  `datasets/`; replace **Available Tools** with the seven tools and their
  `field` / `detail` / `count` semantics; document the new npm scripts
  (`fields:sync`, `fields:coverage`, `probe:fields`); state the descriptor
  contract as the extension point for future groups.
- `AGENTS.md` — currently stale: it documents seven tools, omits `get-drugsfda`
  and `get-drug-adverse-event-counts`, and its module table predates
  `src/drug/`. Rewrite the module table, the registration pattern (descriptor,
  not handler), the request flow, and the tool list.
- `CHANGELOG` entry for 2.0.0 leading with the breaking change.

**Phase 5** (everything else):

- Document the MCP resources and how to read a field catalog.
- Document the weekly drift workflow and the `OPENFDA_API_KEY` repo secret.
- Add a "adding a new API group" section to `CLAUDE.md`, written against the
  extensibility test in §7.4 — this is the document that makes Food and
  Transparency cheap.

A `docs-currency` check is added in Phase 5, to the drift guard test file: the seven
`toolName` values in `DRUG_ENDPOINTS` must each appear in `README.md`,
`CLAUDE.md` and `AGENTS.md`. Cheap, offline, and it stops the tool list from
rotting again.

## 14. Risks

- **Escaping may not be supported upstream.** Mitigated by the Phase-0 spike
  with a decision rule fixed in advance (§9); the reject path is acceptable.
- **Curation judgement.** Exposing too few fields makes a tool feel crippled;
  too many blows the budget. Mitigated by the coverage floor, the budget test,
  and the resource escape hatch for the long tail.
- **Parity drift during the port.** Mitigated by the parity harness, which must
  be green before Phase 3 deletes anything.
- **Clean break friction for existing users.** Accepted deliberately (§4.2),
  mitigated by the migration table and by `1.3.0` remaining installable.
