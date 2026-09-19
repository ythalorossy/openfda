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
npm run probe:drugsfda  # Manual, live-API check that re-validates every advertised get-drugsfda section/field path
```

For single test file: `npx vitest run tests/ApiHandler.test.ts`

## Key Files

- **`vite.config.ts`**: Vite build configuration; externalizes the SDK for StdioServerTransport compatibility, and injects `__APP_VERSION__` from `package.json` at build time so the version reported in `serverInfo` cannot drift from the published version
- **`tests/`**: Vitest test suite (149 tests across 24 files: ApiHandler, OpenFDABuilder, ToolManager, ToolManager.keyguard, env, ndc, ndc-query, ndc-formats, adverse-events-query, adverse-event-counts, event-search, product-ndc-tool, faers, format, label-fields, resolve-label, get-drug-by-name, matched-via, drugsfda-tool, drugsfda-sections, description-drift, redact, no-url-in-output, version)
- **`scripts/capture-fixtures.mjs`**: Manual, live-API script that captures trimmed label fixtures into `tests/fixtures/` (not run in CI)
- **`scripts/smoke-local.mjs`** (`npm run smoke`): Manual end-to-end check that drives the built `dist/index.js` over stdio as a real MCP client would, asserting the behaviours the 1.1.0 and 1.2.0 fixes introduced. Hits the live API, so it is deliberately NOT part of `npm test`; run it after `npm run build:cli` and before publishing. `npm run smoke -- --no-key` exercises the missing-key path instead.
- **`scripts/probe-drugsfda-paths.mjs`** (`npm run probe:drugsfda`): Manual, live-API script that extracts every section/field pair from `src/drug/drugsfda-sections.ts` and probes it against openFDA with `_exists_`. Hits the live API, so it is deliberately NOT part of `npm test`. This is the check that found six fabricated `get-drugsfda` paths in 1.1.0; run it whenever `drugsfda-sections.ts` changes.

## Architecture

### Entry Point: `src/index.ts`
The MCP server is initialized with `McpServer` from `@modelcontextprotocol/sdk`. All tool handlers are defined here and registered via `ToolManager`.

### Tool Registration Pattern
Tools are registered in `src/index.ts` using `ToolManager.registerTool()` with:
- `name`: MCP tool identifier
- `description`: Human-readable description for AI consumers
- `inputSchema`: Zod object schema for input validation
- `handler`: Async function receiving parsed input, returns `{ content: [{ type: 'text', text: string }], isError?: boolean }`

### Tool Registration Chokepoint
`ToolManager.registerTool()` wraps every handler with a call to `checkApiKey()` (`src/utils/env.ts`) before it runs. A missing `OPENFDA_API_KEY` (without `OPENFDA_ALLOW_KEYLESS=1`) returns an actionable configuration error and never reaches `definition.handler`, so no tool can make a network request with a missing key.

### Key Modules
- **`OpenFDABuilder`** (`src/OpenFDABuilder.ts`): Constructs OpenFDA API URLs using fluent builder pattern. Accepts context (`label`, `event`, `ndc`, `drugsfda`), search query, limit, and the optional aggregation/paging parameters `count`, `skip` and `sort`. Omits `api_key` entirely when running keyless.
- **`ApiHandler`** (`src/ApiHandler.ts`): HTTP client with retry logic (exponential backoff), timeout handling, and OpenFDA-specific error categorization.
- **`ToolManager`** (`src/ToolManager.ts`): Wraps `McpServer.registerTool()` registration and enforces the API-key chokepoint described above.
- **`types.ts`**: TypeScript interfaces for OpenFDA API responses and error types.
- **`src/utils/env.ts`**: `checkApiKey()` / `warnIfKeyless()` — decides whether a request may run keyed, keyless (`OPENFDA_ALLOW_KEYLESS=1`), or not at all.
- **`src/utils/redact.ts`**: Strips `api_key` values out of any string before it can reach tool output, logs, or error messages.
- **`src/utils/ndc.ts`**: `normalizeNDC()` — the single validator/normalizer for both NDC tools. Accepts 4-4, 5-3 and 5-4 product NDCs and their package forms; rejects ambiguous undashed 8- and 10-digit input.
- **`src/utils/format.ts`**: `summarizeResults()` / `withTotals()` — reports `Showing N of M` using the upstream result total instead of the caller's limit.
- **`src/drug/label-fields.ts`**: Maps raw label JSON to the fields tools return, including `boxed_warning` and `warnings_and_cautions` (always present, empty array when absent).
- **`src/drug/resolve-label.ts`**: `resolveLabel()` — resolves a drug name through four tiers in order (`openfda.brand_name`, `openfda.generic_name`, `openfda.substance_name`, `spl_product_data_elements`), stopping at the first tier with results and reporting which one matched via `matched_via`. Used by both `get-drug-safety-info` and `get-drug-by-name`.
- **`src/drug/faers.ts`**: Decodes FAERS `reactionoutcome` codes to human-readable labels.
- **`src/drug/event-search.ts`**: `buildEventSearch()` / `EVENT_MATCHED_VIA` — ORs `patient.drug.medicinalproduct`, `openfda.generic_name` and `openfda.substance_name` together so adverse-event searches aren't confined to one FAERS index; shared by `get-drug-adverse-events` and `get-drug-adverse-event-counts`.
- **`src/drug/drugsfda-sections.ts`**: `resolveField()` — the verified table of `get-drugsfda` sections and fields (each checked live via `_exists_`), resolving a (section, field) pair to a real query path or an explanatory error, and upper-casing `sponsor_name` automatically.
- **`src/utils/ndc-formats.ts`**: `NDC_FORMATS` / `invalidNdcMessage()` — the single accepted-format block rendered by both NDC tools, so their error messages can't drift apart.
- **Tool implementations** (`src/drug/`): Individual tool handlers (`get-drug-by-name.ts`, `get-drug-by-ndc.ts`, etc.) exported via `src/drug/index.ts`

### API Request Flow
1. Tool handler receives input → `OpenFDABuilder` constructs URL
2. `makeOpenFDARequest()` fetches with retry/exponential backoff
3. Handler formats response as MCP-compatible JSON text

### Available Tools
- `get-drug-by-name` - Look up a drug by brand, generic or substance name via the four-tier resolver, reporting `matched_via` and a total
- `get-drug-by-generic-name` - Search by active ingredient
- `get-drug-adverse-events` - Adverse event reports, searching three FAERS indexes ORed together (`medicinalproduct`, `openfda.generic_name`, `openfda.substance_name`), with FAERS outcome codes decoded to labels and (reaction, outcome) pairs deduplicated, reporting `matched_via`. Accepts `skip` (maximum 25000) and `sort` (`receivedate:desc` / `receivedate:asc`); without `sort`, results are a deterministic earliest-`report_id` slice
- `get-drug-adverse-event-counts` - Ranks adverse-event values (e.g. reactions, outcomes, patient sex) for a drug by frequency, returning `{term, count}` pairs and reporting `matched_via`. Reports no result total, because openFDA omits one on aggregated responses
- `get-drugs-by-manufacturer` - Drugs by company, reporting `matched_via`
- `get-drug-safety-info` - Warnings, contraindications, interactions; resolves brand/generic/substance names through four tiers, reporting `matched_via`
- `get-drug-by-ndc` - Search by National Drug Code, reporting `matched_via`
- `get-drug-by-product-ndc` - Search by product NDC only. Accepts dashed 4-4 (`0456-4020`), 5-3 (`58151-155`) and 5-4 (`12345-1234`), plus undashed 9- and 11-digit input. Undashed 8- and 10-digit input is rejected as ambiguous rather than guessed.
- `get-drugsfda` - Drugs@FDA application data, searched by section and field against a table of verified paths (`application`: `application_number`, `sponsor_name`; `openfda`: `application_number`, `brand_name`, `generic_name`, `manufacturer_name`, `route`, `substance_name`, `product_ndc`; `products`: `dosage_form`, `marketing_status`, `product_number`, `reference_drug`, `route`, `te_code`; `submissions`: `review_priority`, `submission_class_code`, `submission_number`, `submission_status`, `submission_status_date`, `submission_type`; `application_docs`: `id`, `url`, `date`, `type`). Accepts `limit` and reports `Showing N of M` and `matched_via`; `sponsor_name` is stored uppercase and normalised automatically

## Environment

Requires `OPENFDA_API_KEY` from your MCP client's `env` block; the server reads it directly from `process.env` at runtime and **does not load a `.env` file** (no `dotenv` dependency is declared). Set `OPENFDA_ALLOW_KEYLESS=1` to opt in to openFDA's unauthenticated tier (40 requests/minute, 1,000/day per IP, no rate-limit headers) instead of supplying a key.
