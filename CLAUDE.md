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
```

For single test file: `npx vitest run tests/ApiHandler.test.ts`

## Key Files

- **`vite.config.ts`**: Vite build configuration; externalizes SDK for StdioServerTransport compatibility
- **`tests/`**: Vitest test suite (78 tests across 15 files: ApiHandler, OpenFDABuilder, ToolManager, ToolManager.keyguard, env, ndc, ndc-query, adverse-events-query, product-ndc-tool, faers, format, label-fields, resolve-label, redact, no-url-in-output)
- **`scripts/capture-fixtures.mjs`**: Manual, live-API script that captures trimmed label fixtures into `tests/fixtures/` (not run in CI)

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
- **`OpenFDABuilder`** (`src/OpenFDABuilder.ts`): Constructs OpenFDA API URLs using fluent builder pattern. Accepts context (`label`, `event`, `ndc`, `drugsfda`), search query, and limit. Omits `api_key` entirely when running keyless.
- **`ApiHandler`** (`src/ApiHandler.ts`): HTTP client with retry logic (exponential backoff), timeout handling, and OpenFDA-specific error categorization.
- **`ToolManager`** (`src/ToolManager.ts`): Wraps `McpServer.registerTool()` registration and enforces the API-key chokepoint described above.
- **`types.ts`**: TypeScript interfaces for OpenFDA API responses and error types.
- **`src/utils/env.ts`**: `checkApiKey()` / `warnIfKeyless()` — decides whether a request may run keyed, keyless (`OPENFDA_ALLOW_KEYLESS=1`), or not at all.
- **`src/utils/redact.ts`**: Strips `api_key` values out of any string before it can reach tool output, logs, or error messages.
- **`src/utils/format.ts`**: `summarizeResults()` / `withTotals()` — reports `Showing N of M` using the upstream result total instead of the caller's limit.
- **`src/drug/label-fields.ts`**: Maps raw label JSON to the fields tools return, including `boxed_warning` and `warnings_and_cautions` (always present, empty array when absent).
- **`src/drug/resolve-label.ts`**: `resolveLabel()` — resolves a drug name through four tiers in order (`openfda.brand_name`, `openfda.generic_name`, `openfda.substance_name`, `spl_product_data_elements`), reporting which tier matched via `matched_via`. Used by `get-drug-safety-info`.
- **`src/drug/faers.ts`**: Decodes FAERS `reactionoutcome` codes to human-readable labels.
- **Tool implementations** (`src/drug/`): Individual tool handlers (`get-drug-by-name.ts`, `get-drug-by-ndc.ts`, etc.) exported via `src/drug/index.ts`

### API Request Flow
1. Tool handler receives input → `OpenFDABuilder` constructs URL
2. `makeOpenFDARequest()` fetches with retry/exponential backoff
3. Handler formats response as MCP-compatible JSON text

### Available Tools
- `get-drug-by-name` - Search by brand name
- `get-drug-by-generic-name` - Search by active ingredient
- `get-drug-adverse-events` - Adverse event reports, with FAERS outcome codes decoded to labels and (reaction, outcome) pairs deduplicated
- `get-drugs-by-manufacturer` - Drugs by company
- `get-drug-safety-info` - Warnings, contraindications, interactions; resolves brand/generic/substance names through four tiers, reporting `matched_via`
- `get-drug-by-ndc` - Search by National Drug Code
- `get-drug-by-product-ndc` - Search by product NDC only (accepts 5-4 and 5-3 formats)
- `get-drugsfda` - Drugs@FDA application data by section (`application`, `openfda`, `products`, `submissions`, `application_docs`) and field

## Environment

Requires `OPENFDA_API_KEY` from your MCP client's `env` block; the server reads it directly from `process.env` at runtime and **does not load a `.env` file** (no `dotenv` dependency is declared). Set `OPENFDA_ALLOW_KEYLESS=1` to opt in to openFDA's unauthenticated tier (40 requests/minute, 1,000/day per IP, no rate-limit headers) instead of supplying a key.
