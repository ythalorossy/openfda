# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides tools for querying drug information from the OpenFDA API. The server communicates over stdio and requires an `OPENFDA_API_KEY` environment variable.

## Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run build:cli  # Build + add shebang for bin entry (required for CLI)
npm run dev        # Start development server
npm run test       # Run Vitest tests
npm run test:ci    # Run tests in CI mode (no watch)
npm run typecheck  # TypeScript type checking
npm run lint       # Run ESLint
npm run smoke      # Manual end-to-end check against the built dist/ (hits the live API)
npm run probe:faers-codes  # Manual, live-API check that re-validates the FAERS code maps against openFDA's published field reference
npm run fields:sync      # Manual, live-API script that downloads FDA's published field reference and writes the committed src/catalog/drug-*.json files
npm run fields:coverage  # Manual, live-API script that measures what fraction of records populate each catalog field, writing src/catalog/drug-*.coverage.json
npm run fields:countable # Manual, live-API script that measures which declared count fields openFDA can actually aggregate, writing src/catalog/drug-*.countable.json
npm run probe:fields     # Manual, live-API script that checks every path every descriptor exposes actually returns data (not merely published)
```

For single test file: `npx vitest run tests/ApiHandler.test.ts`

`.github/workflows/fields-drift.yml` re-downloads FDA's field references every
Monday and re-probes every exposed field, opening an issue on failure. It needs
the `OPENFDA_API_KEY` repository secret. Run it by hand from the Actions tab
after changing any descriptor's field list.

## Key Files

- **`vite.config.ts`**: Vite build configuration; externalizes the SDK for StdioServerTransport compatibility, and injects `__APP_VERSION__` from `package.json` at build time so the version reported in `serverInfo` cannot drift from the published version
- **`tests/`**: Vitest test suite (528 tests across 42 files: ApiHandler, bundle-size, catalog-conformance, catalog-coverage, catalog-shape, core/budget, core/codes, core/descriptor, core/envelope, core/escape, core/executor, core/http, core/project, core/query, core/registry, core/resources, core/strategy, datasets/drug-drugsfda, datasets/drug-enforcement, datasets/drug-event, datasets/drug-label, datasets/drug-ndc, datasets/drug-orangebook, datasets/drug-shortages, datasets/faers, docs-currency, drift-guard, env, faers-codes, format, label-fields, ndc, ndc-formats, no-raw-query, no-url-in-output, OpenFDABuilder, redact, registration, schema-budget, ToolManager, ToolManager.keyguard, version)
- **`docs/superpowers/notes/2026-09-20-field-selection.md`**: The authoritative record of which fields each `drug-*` descriptor exposes in its `field` enum, and why — including every field that was seeded but deliberately dropped. No code reads this file; it is the rationale behind `src/datasets/drug/*.ts`.
- **`scripts/capture-fixtures.mjs`**: Manual, live-API script that captures trimmed label fixtures into `tests/fixtures/` (not run in CI)
- **`scripts/smoke-local.mjs`** (`npm run smoke`): Manual end-to-end check that drives the built `dist/index.js` over stdio as a real MCP client would, asserting the behaviours the 1.1.0 through 2.0.0 fixes introduced. Hits the live API, so it is deliberately NOT part of `npm test`; run it after `npm run build:cli` and before publishing. `npm run smoke -- --no-key` exercises the missing-key path instead.
- **`scripts/probe-faers-codes.mjs`** (`npm run probe:faers-codes`): Manual, live-API script that re-validates the FAERS code maps in `src/datasets/drug/faers.ts` (`SERIOUSNESS`, `PATIENT_SEX`, `REACTION_OUTCOMES`) against openFDA's published field reference (`https://open.fda.gov/fields/drugevent.yaml`). Hits the live API, so it is deliberately NOT part of `npm test`; run it whenever `faers.ts`'s code maps change.
- **`scripts/fields-sync.mjs`** (`npm run fields:sync`): Manual, live-API script that downloads openFDA's published field reference for every drug endpoint and writes the trimmed, committed `src/catalog/drug-<endpoint>.json` files — the offline source of truth `tests/catalog-conformance.test.ts` checks every descriptor path against.
- **`scripts/fields-coverage.mjs`** (`npm run fields:coverage`): Manual, live-API script that asks openFDA how many records actually populate each catalog field (`_exists_:<path>`) and writes `src/catalog/drug-<endpoint>.coverage.json`. This is the evidence behind the exposed-field selection recorded in `docs/superpowers/notes/2026-09-20-field-selection.md`.
- **`scripts/fields-countable.ts`** (`npm run fields:countable`): Manual, live-API script that asks openFDA whether every declared `countFields` path (and its `.exact` alternate) can actually be aggregated, and writes `src/catalog/drug-<endpoint>.countable.json`. Countability is a property of openFDA's index mapping with no derivable rule — of the 30 count fields declared at 2.0.0, 14 were rejected upstream while 16 near-identical ones were accepted — so it has to be measured and committed for `tests/catalog-conformance.test.ts` to guard offline. Unlike `fields-sync.mjs`, it derives its endpoint list from `DRUG_ENDPOINTS` rather than a hardcoded map, so a new group needs only the `drug-` filename prefix parameterized, not its slugs listed separately. Hits the live API, so it is deliberately NOT part of `npm test`; run it whenever a descriptor's `countFields` change, and weekly via `fields-drift.yml`.
- **`scripts/probe-fields.ts`** (`npm run probe:fields`): Manual, live-API script that checks every path every `DRUG_ENDPOINTS` descriptor exposes (`fields` + `countFields`) with an `_exists_:<path>` count. `tests/catalog-conformance.test.ts` already proves a path is *published*, offline; this proves it is *populated* — a published-but-empty field presents as a valid search that always finds nothing, indistinguishable from absent data. Run through `tsx` against `src/` directly, not `dist/`: `vite.config.ts` bundles a single `dist/index.js` with `preserveModules: false`, so `dist/datasets/...` does not exist for anything to import. Hits the live API, so it is deliberately NOT part of `npm test`; run it whenever a descriptor's `fields` or `countFields` change.

## Architecture

### Entry Point: `src/index.ts`
The MCP server is initialized with `McpServer` from `@modelcontextprotocol/sdk`, then calls `registerDataset(toolManager, DRUG_ENDPOINTS)` (`src/core/registry.ts`). No tool handler is written by hand: `registerDataset` builds each tool's Zod schema, description and handler purely from a descriptor. Immediately after, `registerCatalogResources(server, DRUG_ENDPOINTS, ...)` (`src/core/resources.ts`) publishes each endpoint's full FDA field catalog as an MCP resource at `openfda://<dataset>/<endpoint>/fields` — the `capabilities.resources: {}` declared since 1.0, finally used.

### Field Catalog Resources: the long tail, on demand
A tool's `field` enum is curated to ~10–20 entries because every tool's schema loads into an agent's context on connect, called or not; the several-hundred-field long tail FDA actually publishes (207 for `drug-label`, down to 31 for `drug-orangebook`) would blow that budget if exposed as enum values. `src/core/resources.ts`'s `registerCatalogResources()` instead publishes it as a resource per endpoint — read only on demand, at zero standing context cost. `src/datasets/drug/catalogs.ts`'s `DRUG_CATALOGS` builds the served payload by merging each `src/catalog/drug-<endpoint>.json` (the published field list) with `src/catalog/drug-<endpoint>.coverage.json` (measured `coverage_pct` per field, `null` for any path coverage doesn't cover), so a model choosing a field from the long tail can tell a real-but-empty field from one worth searching. Because the catalogs are imported (not read from disk at runtime), they are bundled into `dist/index.js`; `tests/bundle-size.test.ts` guards that bundle against unbounded growth.

### The Descriptor Contract: the extension point
`src/core/descriptor.ts` defines `EndpointDescriptor` — the one interface a new tool must satisfy: `dataset`/`endpoint`/`toolName`, `fields` (the `field` enum; each entry names a `SearchStrategy`), `projections` (the `detail` enum; each entry names the fields it guarantees to return), optional `extraFilters`, `sortFields`, `countFields`, `codeMaps`, `limits`, and `catalog` (the path to the committed FDA field-reference JSON that `tests/catalog-conformance.test.ts` checks it against). `validateDescriptor()` runs at registration time and fails startup loudly on a malformed descriptor (a duplicate field or projection name, a strategy that declares no paths, a schema key colliding with a built-in parameter such as `field`/`value`/`detail`, `limits.default` exceeding `limits.max`, etc.) — a broken descriptor can never reach a live tool. `countFields` is additionally guarded offline against `src/catalog/drug-<endpoint>.countable.json` (written by `npm run fields:countable`): being published (the catalog) and being populated (`probe:fields`) do not imply a field can be aggregated — 14 of the 30 count fields declared at 2.0.0 passed both of those checks and were still rejected by openFDA's aggregation endpoint.

Adding a tool is: write one descriptor file under `src/datasets/<group>/`, add it to that group's exported array (e.g. `DRUG_ENDPOINTS` in `src/datasets/drug/index.ts`). `core/` gains no drug-specific knowledge to support it — this is what let `drug-ndc`, `drug-enforcement`, `drug-orangebook` and `drug-shortages` all land as pure additions, completing the seven-endpoint drug group.

### The Executor: the one request pipeline
`src/core/executor.ts`'s `execute(descriptor, input)` is every tool's handler. In order: resolve `field` to a `FieldSpec` and validate/normalize `value` (a field's own `normalize`, e.g. NDC shape checking); reject `skip` above `SKIP_MAX` (25000, openFDA's own ceiling) and `count` values not in `descriptor.countFields`; resolve `detail` to a `Projection`; turn the field's `SearchStrategy` into one or more `ClauseSet`s (`src/core/search/strategy.ts`); assemble the actual openFDA query string in exactly one place, `src/core/search/query.ts`'s `buildQuery()` — every clause value passes through `src/core/search/escape.ts`'s `escapeSearchValue()` first, and there is no other seam through which a descriptor author could build a query string and skip that; resolve `limit`, which caps rows for a record search but buckets under `count`, where an absent `limit` becomes `COUNT_BUCKET_DEFAULT` (100) instead of the descriptor's record default; fetch a page via `src/core/http.ts`'s `fetchPage()`, which classifies the response as `hit` / `miss` (openFDA's zero-match 404 with `error.code: NOT_FOUND` — data, not a failure) / `bad_request` (openFDA refused the request outright, which a declared-but-unaggregatable `count` or an unsortable `sort` produces — reported to the caller, never retried or read as an outage) / `error` (a genuine upstream failure); on a hit, project records through the chosen `Projection`, wrap them in the one envelope shape (`src/core/shape/envelope.ts`: `matched_via`, `total`, `returned`, `limit`, `dropped_for_budget`, `next_skip`, `results`), and trim rows to fit the 60,000-character response budget (`src/core/shape/budget.ts`), reporting the drop count in the envelope as well as the header — `next_skip` advances by the rows actually returned, so a caller paging by it cannot step over a dropped row; on `count`, decode ranked terms via `src/core/codes.ts`'s `decodeTerm()` against the descriptor's `codeMaps` and trim buckets through that same budget, reporting `dropped_for_budget` but no `next_skip`, which an aggregation has no semantics for.

Because every tool is this one function plus a descriptor, escaping, parenthesization, the skip ceiling, the response budget and the five possible outcomes (hit, miss, rejected argument, upstream error, input error) cannot vary between tools — a fix here is a fix everywhere.

### `core/` contains no drug knowledge
Every file under `src/core/` operates only on generic shapes (`EndpointDescriptor`, `FieldSpec`, `SearchStrategy`, `Clause`, `Projection`). Nothing in `core/` imports from `src/datasets/`, names a drug field, or hardcodes a tool name.

### The Catalog: the offline source of truth
`src/catalog/drug-<endpoint>.json` is a trimmed, committed copy of FDA's own published field reference (written by `npm run fields:sync`), paired with `src/catalog/drug-<endpoint>.coverage.json` (written by `npm run fields:coverage`), which records what fraction of records actually populate each field, and `src/catalog/drug-<endpoint>.countable.json` (written by `npm run fields:countable`), which records which declared `countFields` paths openFDA's index will actually aggregate. `tests/catalog-conformance.test.ts` checks every path a descriptor's `fields`/`sortFields`/`countFields`/`codeMaps` reference against the catalog, and every `countFields` entry against the `.countable.json` measurement, so a fabricated field name — the class of defect the now-removed `probe:drugsfda` script used to catch for one endpoint by hitting the live API — can never reach a tool schema for any endpoint, and the check runs offline in CI.

### Tool Registration Chokepoint
`ToolManager.registerTool()` wraps every handler with a call to `checkApiKey()` (`src/utils/env.ts`) before it runs. A missing `OPENFDA_API_KEY` (without `OPENFDA_ALLOW_KEYLESS=1`) returns an actionable configuration error and never reaches `definition.handler`, so no tool can make a network request with a missing key.

### Key Modules
- **`src/core/descriptor.ts`**: `EndpointDescriptor` / `validateDescriptor()` — the extension-point contract described above.
- **`src/core/registry.ts`**: `toToolDefinition()` / `registerDataset()` / `buildDescription()` / `buildInputSchema()` — builds a tool's description, Zod schema and handler from a descriptor.
- **`src/core/executor.ts`**: `execute()` — the one request pipeline. `COUNT_BUCKET_DEFAULT` (100) is openFDA's own bucket ceiling when `count` is set and `limit` is absent; an explicit `limit` remains capped by the descriptor's record `limits.max`, so on six of the seven tools a caller can *receive* more buckets than they can *explicitly request* (see the "Available Tools" preamble below).
- **`src/core/paging.ts`**: `SKIP_MAX` (25000) — openFDA's own paging offset ceiling; lives in its own module (rather than `executor.ts`) because `shape/envelope.ts` needs it too, and `executor.ts` already imports `envelope.ts`.
- **`src/core/search/strategy.ts`**: `SearchStrategy` / `planClauseSets()` / `declaredPaths()` — how a `field` name resolves to one or more clause sets.
- **`src/core/search/query.ts`**: `buildQuery()` — the only place an openFDA search string is assembled; refuses to render an empty clause group.
- **`src/core/search/escape.ts`**: `escapeSearchValue()` — escapes a caller value for use inside a quoted openFDA term; the fix for the search-value injection defect (see the migration notes in `README.md`).
- **`src/core/http.ts`**: `fetchPage()` — one openFDA page request, classified into `hit` / `miss` / `error` / `bad_request` (openFDA rejected the request outright — a declared field or count/sort combination no longer accepted by its index — reported to the caller instead of retried or mistaken for an outage).
- **`src/core/shape/project.ts`**: `applyProjection()` / `capArray()` — projects a raw record through a descriptor's chosen `Projection`.
- **`src/core/shape/envelope.ts`**: `buildEnvelope()` — the one response envelope every endpoint returns: `matched_via, total, returned, limit, dropped_for_budget, next_skip, results`.
- **`src/core/shape/budget.ts`**: `fitToBudget()` / `MAX_RESPONSE_CHARS` (60,000) — caps a response, dropping trailing rows rather than truncating JSON mid-string.
- **`src/core/codes.ts`**: `decodeTerm()` — decodes a coded aggregation term via a descriptor's `codeMaps`.
- **`src/core/resources.ts`**: `registerCatalogResources()` — publishes one MCP resource per endpoint (`openfda://<dataset>/<endpoint>/fields`), serving the full field catalog described above.
- **`src/datasets/drug/catalogs.ts`**: `DRUG_CATALOGS` — the drug group's catalog payloads, each a `src/catalog/drug-<endpoint>.json` merged with its `.coverage.json`.
- **`src/datasets/drug/index.ts`**: `DRUG_ENDPOINTS` — the drug API group's descriptor array; consumed by `src/index.ts` and by `tests/docs-currency.test.ts`.
- **`src/datasets/drug/label.ts`, `event.ts`, `drugsfda.ts`, `ndc.ts`, `enforcement.ts`, `orangebook.ts`, `shortages.ts`**: One `EndpointDescriptor` each — `drug-label`, `drug-event`, `drug-drugsfda`, `drug-ndc`, `drug-enforcement`, `drug-orangebook`, `drug-shortages`.
- **`src/datasets/drug/faers.ts`**: FAERS code maps (`SERIOUSNESS`, `PATIENT_SEX`, `REACTION_OUTCOMES`) and `describeOutcome()`, consumed by the `drug-event` descriptor's `summary` projection.
- **`src/datasets/drug/label-fields.ts`**: `mapLabelFields()` / `mapSafetyFields()` / `resolveGenericName()` — maps raw label JSON to the fields `drug-label`'s projections return; `boxed_warning` and `warnings_and_cautions` are always present, empty array when absent; `resolveGenericName()` returns `null`, never `'Unknown'`, when neither structured field is present.
- **`OpenFDABuilder`** (`src/OpenFDABuilder.ts`): Constructs OpenFDA API URLs using a fluent builder pattern. Takes dataset, endpoint, the pre-escaped search string, limit, and the optional aggregation/paging parameters `count`, `skip` and `sort`. Omits `api_key` entirely when running keyless.
- **`ApiHandler`** (`src/ApiHandler.ts`): HTTP client with retry logic (exponential backoff), timeout handling, and OpenFDA-specific error categorization.
- **`ToolManager`** (`src/ToolManager.ts`): Wraps `McpServer.registerTool()` registration and enforces the API-key chokepoint described above.
- **`types.ts`**: TypeScript interfaces for OpenFDA API responses and error types.
- **`src/utils/env.ts`**: `checkApiKey()` / `warnIfKeyless()` — decides whether a request may run keyed, keyless (`OPENFDA_ALLOW_KEYLESS=1`), or not at all.
- **`src/utils/redact.ts`**: Strips `api_key` values out of any string before it can reach tool output, logs, or error messages.
- **`src/utils/ndc.ts`**: `normalizeNDC()` — the single validator/normalizer for `drug-label`'s `ndc` field and `drug-ndc`'s `product_ndc` field. Accepts 4-4, 5-3 and 5-4 product NDCs and their package forms; rejects ambiguous undashed 8- and 10-digit input.
- **`src/utils/format.ts`**: `summarizeResults()` / `withTotals()` — reports `Showing N of M` using the upstream result total instead of the caller's limit.
- **`src/utils/ndc-formats.ts`**: `NDC_FORMATS` / `invalidNdcMessage()` — the accepted-NDC-format block rendered in both `drug-label`'s and `drug-ndc`'s NDC error messages.

## Available Tools

Every tool takes `field` + `value`, `limit`/`skip`, and `detail`; `sort` and `count` are present only when the descriptor declares them. The response envelope always carries `matched_via` (which path actually matched), `total` (the upstream match count, not the number of rows in this response), `returned` (how many rows it does carry), `limit`, `dropped_for_budget` (rows dropped to stay inside the 60,000-character budget — 0 when none were, never omitted), `next_skip` (the offset to resume from; `null` when the result set is exhausted or the next offset would exceed `SKIP_MAX`) and `results`. **Advance paging by `next_skip`, not `skip + limit`** — the response budget can drop trailing rows, so `skip + limit` silently steps over exactly the rows that were dropped. A zero-match search returns a plain no-results message, not an error, and every response is capped at 60,000 characters.

`limit` means two different things depending on whether `count` is set: for a record search it caps rows returned (capped at the descriptor's `limits.max` below, whether given explicitly or defaulted); for an aggregation it caps buckets, defaulting to 100 (openFDA's own bucket ceiling) when omitted. This produces an asymmetry on six of the seven tools (every one except `drug-drugsfda`, whose record max is already 100): omitting `limit` under `count` can return up to 100 buckets, but an explicit `limit` is still rejected above the tool's record `max` — so a caller can *receive* more buckets than they can *explicitly request*. Record maxes: `drug-label` 25, `drug-event` 50, `drug-drugsfda` 100, `drug-ndc` 50, `drug-enforcement` 50, `drug-orangebook` 50, `drug-shortages` 50. An aggregated response is trimmed to the same 60,000-character budget and reports `dropped_for_budget` for the buckets it dropped, with `returned` counting the buckets actually kept; it carries no `next_skip`, because an aggregation has no result total and no skip semantics for one to mean anything against.

- **`drug-label`** — Search FDA structured product labels (SPL). `field`: `drug_name` (tiered: `openfda.brand_name` → `openfda.generic_name` → `openfda.substance_name` → `spl_product_data_elements`), `ndc`, `spl_product_data_elements`, `effective_time`, `id`, `set_id`, `brand_name`, `generic_name`, `substance_name`, `manufacturer_name`, `route`, `product_type`, `application_number`, `unii`, `rxcui`. `detail`: `summary` (default), `safety` (warnings, contraindications, interactions, overdosage; `generic_name` resolves to `null`, never `'Unknown'`, when unstructured), `full`. `count`: `openfda.route.exact`, `openfda.product_type.exact`, `openfda.manufacturer_name.exact`. `sort`: `effective_time:desc`/`effective_time:asc`. `limit` default 1, max 25. `route` here is the SPL route vocabulary — different from `drug-drugsfda`'s `products.route`.
- **`drug-event`** — Search FAERS adverse event reports. `field`: `drug_name` (unions `patient.drug.openfda.generic_name`, `patient.drug.openfda.substance_name` and `patient.drug.medicinalproduct` — verified live, the top-level `openfda.generic_name`/`openfda.substance_name` return `NOT_FOUND` on this index), `brand_name`, `manufacturer_name`, `product_ndc`, `pharm_class`, `drug_characterization`, `indication`, `reaction`, `reaction_outcome`, `serious`, `seriousness_death`, `patient_sex`, `reporter_qualification`, `country`, `received_date`, `report_id`. `detail`: `summary` (default; FAERS codes decoded, (reaction, outcome) pairs deduplicated), `full`. `extraFilters`: `seriousness` (`serious`/`non-serious`/`all`, default `all`). `sort`: `receivedate:desc`/`receivedate:asc`; without `sort`, results are a deterministic earliest-`report_id` slice. `count`: `patient.reaction.reactionmeddrapt.exact`, `patient.reaction.reactionoutcome`, `serious`, `patient.patientsex`, `occurcountry.exact`, `patient.drug.openfda.generic_name.exact`. `limit` default 10, max 50. Note: the searchable `received_date` field maps to `receivedate`, but the `summary` projection's `report_date` reads `receiptdate` — two different, near-duplicate FAERS date fields inherited from 1.x; filtering by one and reading the other back will not, in general, agree.
- **`drug-drugsfda`** — Search Drugs@FDA application data. `field`: `products.brand_name` (default, 98.79% populated), `application_number`, `sponsor_name` (stored uppercase upstream; normalised automatically), `products.active_ingredients.name`, `products.dosage_form`, `products.route`, `products.marketing_status`, `products.reference_drug`, `products.te_code`, `openfda.brand_name`, `openfda.generic_name`, `openfda.substance_name`, `openfda.manufacturer_name`, `openfda.route`, `openfda.product_ndc` (the `openfda.*` names are exact but only ~42% populated — the precise complement to `products.brand_name`, not the default), `submissions.submission_type`, `submissions.submission_status`, `submissions.submission_status_date`, `submissions.submission_class_code`, `submissions.review_priority`. `detail`: `summary` (default; application, sponsor, `openfda` block and `products` — each product carries `te_code`, `null` when absent — plus `submission_count`, no `submissions` array), `full` (adds `submissions`, capped at 10 per record, plus `submissions_truncated` when more were omitted). `count`: `sponsor_name`, `products.marketing_status`, `products.dosage_form.exact`. `sort`: none. `limit` default 5, max 100. `products.route` here is Drugs@FDA's own route vocabulary — different from `drug-label`'s `route`. 20 of the 49 fields FDA publishes for this endpoint are exposed; seven candidate paths (duplicates, per-application ordinals, and opaque per-document values) were deliberately dropped — see `docs/superpowers/notes/2026-09-20-field-selection.md`.
- **`drug-ndc`** — Search the NDC Directory: every drug product currently listed with the FDA. This is the **product registry** (packaging, labeler, marketing category, application number) — distinct from `drug-label`'s `ndc` field, which searches *labelling text* by NDC; see `README.md`'s migration table for which 1.x tool maps to which of the two. `field`: `product_ndc`, `packaging.package_ndc`, `generic_name`, `brand_name`, `active_ingredients.name`, `openfda.manufacturer_name`, `marketing_category`, `application_number`, `dosage_form`, `route`, `product_type`, `pharm_class`, `marketing_start_date`, `openfda.unii`, `openfda.rxcui`, `openfda.spl_set_id`. `detail`: `summary` (default; identity, packaging and marketing status), `full` (raw upstream record). `count`: `dosage_form.exact`, `route.exact`, `product_type.exact`, `marketing_category`, `openfda.manufacturer_name.exact`. `sort`: none. `limit` default 5, max 50. `labeler_name` is absent from FDA's own field reference for this endpoint, so `openfda.manufacturer_name` is exposed for the "which company" question instead — see `docs/superpowers/notes/2026-09-20-field-selection.md` (`## ndc`).
- **`drug-enforcement`** — Search FDA drug recall and enforcement reports. `classification` is the hazard level (Class I: reasonable probability of serious harm or death; II: temporary or reversible harm; III: unlikely harm); `status` says whether a recall is Ongoing, Completed or Terminated — appearing in results does not mean it is still in effect. `field`: `product_description` (default, 100% populated), `recall_number`, `event_id`, `code_info`, `recalling_firm`, `reason_for_recall`, `classification`, `status`, `voluntary_mandated`, `state`, `country`, `recall_initiation_date`, `report_date`, `termination_date`, `openfda.generic_name`, `openfda.brand_name`, `openfda.product_ndc` (the three `openfda.*` names are exact but only ~18% populated — the precise complement to `product_description`, not the default). `detail`: `summary` (default; `openfda` returned as one bundled object), `full`. `count`: `classification.exact`, `status.exact`, `state.exact`, `voluntary_mandated.exact`, `recalling_firm.exact`. `sort`: `report_date:desc`/`report_date:asc`/`recall_initiation_date:desc`. `limit` default 5, max 50. `product_type` was seeded by the field-selection plan but dropped — it is always `"Drugs"` on this endpoint and can never narrow a search — see `docs/superpowers/notes/2026-09-20-field-selection.md` (`## enforcement`).
- **`drug-orangebook`** — Search the Orange Book: FDA-approved drug products with their therapeutic-equivalence ratings. Almost all data lives in the nested `products` array; this tool flattens it into one entry per product. `field`: `products.brand_name`, `products.active_ingredients.name`, `products.application_number`, `products.application_type`, `products.application_full_name`, `products.application_name`, `products.therapeutic_equivalence_codes`, `products.reference_listed_drug`, `products.reference_standard`, `products.dosage_form`, `products.route`, `approval_date`. `detail`: `summary` (default; `approval_date`, `product_number`, flattened `products`; `reference_listed_drug`/`reference_standard` are booleans always returned, `false` a fact — "not the reference product" — not a missing value), `full`. `count`: `products.application_type`, `products.dosage_form.exact`, `products.route.exact`, `products.therapeutic_equivalence_codes`. `sort`: `approval_date:desc`/`approval_date:asc`. `limit` default 5, max 50. `products.marketing_status` was seeded by the plan but dropped — it is not published in FDA's field reference for this endpoint — see `docs/superpowers/notes/2026-09-20-field-selection.md` (`## orangebook`).
- **`drug-shortages`** — Search FDA drug shortage reports. `status` is one of three values, live-verified 2026-09-21: `Current` (1153 records), `To Be Discontinued` (443), or `Resolved` (7) — a product appearing here is not necessarily short now, and `To Be Discontinued` is neither "current" nor "resolved" but the largest of the two non-`Current` states. openFDA sends an empty string, not `null`, for an absent date on this endpoint; the `summary` projection normalises those to `null`. `field`: `generic_name` (default), `company_name`, `openfda.manufacturer_name`, `openfda.brand_name`, `openfda.substance_name`, `package_ndc`, `openfda.product_ndc`, `status`, `therapeutic_category`, `dosage_form`, `update_type`, `initial_posting_date`, `update_date`. `detail`: `summary` (default; `openfda` returned as one bundled object), `full`. `count`: `status`, `dosage_form.exact`, `therapeutic_category`, `company_name.exact`. `sort`: `update_date:desc`/`update_date:asc`/`initial_posting_date:desc`. `limit` default 10, max 50. Smallest drug dataset (~1,600 records); `openfda.generic_name` was seeded by the plan but dropped — not published in FDA's field reference for this endpoint — see `docs/superpowers/notes/2026-09-20-field-selection.md` (`## shortages`). This completes `DRUG_ENDPOINTS` at seven.

## Environment

Requires `OPENFDA_API_KEY` from your MCP client's `env` block; the server reads it directly from `process.env` at runtime and **does not load a `.env` file** (no `dotenv` dependency is declared). Set `OPENFDA_ALLOW_KEYLESS=1` to opt in to openFDA's unauthenticated tier (40 requests/minute, 1,000/day per IP, no rate-limit headers) instead of supplying a key.

## Adding a new API group

`src/core/` contains no dataset knowledge. Adding a group (e.g. Food,
Transparency) is data, not a change to the executor:

1. Add the endpoint's slug to `scripts/fields-sync.mjs`'s `ENDPOINTS` map and
   run `npm run fields:sync`, `npm run fields:coverage` and
   `npm run fields:countable`. These write the committed
   `src/catalog/drug-<endpoint>.json` / `.coverage.json` / `.countable.json`
   files — nothing downstream can check a path until they exist. All three
   scripts currently hardcode the `drug-` prefix on every path they read and
   write (`src/catalog/drug-${endpoint}.json` in `fields-sync.mjs`,
   `fields-coverage.mjs` and `fields-countable.ts` reading it back the same
   way), so a non-drug group needs that prefix parameterized on its own
   filenames too. `fields-countable.ts` is the one exception on the other
   half of the problem: it derives its endpoint list from the descriptor
   array (`DRUG_ENDPOINTS`) rather than a hardcoded `ENDPOINTS` map, so a new
   group needs only the prefix parameterized there, not its slugs listed a
   second time.
2. Pick the exposed fields from the coverage data (criteria: published,
   searchable scalar, at least 5% coverage, real query utility; 10–20
   fields). Record the choice and its justification in
   `docs/superpowers/notes/`, the way `2026-09-20-field-selection.md` does
   for the drug group — including every field that was seeded but
   deliberately dropped.
3. Write `src/datasets/<group>/<endpoint>.ts` as an `EndpointDescriptor` and
   add it to that group's exported array (e.g. a new `FOOD_ENDPOINTS` in
   `src/datasets/food/index.ts`).
4. Register the group in `src/index.ts` with `registerDataset(toolManager,
   <GROUP>_ENDPOINTS)`, and its catalogs with
   `registerCatalogResources(server, <GROUP>_ENDPOINTS, ...)`.
5. Run `npm run test:ci` — `catalog-conformance`, `schema-budget`,
   `drift-guard` and `docs-currency` all apply automatically to the new
   descriptors, nothing bespoke to wire up. Then run the live-API probe:
   `scripts/probe-fields.ts` currently imports `DRUG_ENDPOINTS` by name, so
   it also needs the new group's array added (or the import generalized)
   before `npm run probe:fields` actually covers it.
6. Document the new tools in README.md, CLAUDE.md and AGENTS.md.

Two things the next group will hit immediately:

- **The schema budget is measured over `DRUG_ENDPOINTS` alone.**
  `tests/schema-budget.test.ts` caps the total tool-schema cost at 20,000
  characters, and the seven drug tools already measure ~19,212 of it. A
  second group roughly doubles the always-loaded tool surface (every tool's
  schema loads into an agent's context on connect, called or not), so this
  ceiling must be raised deliberately, or the guard changed to sum every
  registered group instead of importing `DRUG_ENDPOINTS` by name — decide
  which before adding the group, not after the test fails.
- **`scripts/fields-sync.mjs` has a hardcoded endpoint map (and a hardcoded
  `drug-` filename prefix, see Step 1 above).** A new group's slugs — and,
  today, its own copy of the file-naming logic — are needed before
  `fields:sync`, `fields:coverage`, or any offline guard built on their
  output can see the new endpoints at all.

**If a new group forces a change under `src/core/`, the descriptor contract
is wrong.** Fix the contract; do not special-case the group.

## Release checklist

1. `npm run fields:sync && npm run fields:coverage && npm run fields:countable` — refresh the catalogs
2. `npm run test:ci && npm run typecheck && npm run lint`
3. `npm run build:cli`
4. `npm run probe:fields` — every exposed path still returns data; every declared count field still aggregates
5. `npm run probe:faers-codes` — FAERS code maps still match the reference
6. `npm run smoke` — end-to-end over stdio against the live API
7. `npm run smoke -- --no-key` — the missing-key path still fails cleanly
8. Bump the version, update `CHANGELOG.md`, commit, tag, publish

Steps 4–7 hit the live API and are not part of `npm test`; a green unit suite
over stubs does not prove the live surface still works. Stop and fix (or
escalate) on the first failure rather than tagging past it.
