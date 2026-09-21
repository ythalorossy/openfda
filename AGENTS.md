# AGENTS.md

This file provides guidance for agentic coding assistants (e.g., Claude Code, Copilot) working in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides tools for querying drug information from the OpenFDA API. The server communicates over stdio and requires an `OPENFDA_API_KEY` environment variable.

## Build / Lint / Test Commands

```bash
# Build
npm run build        # Compile TypeScript to dist/ (Vite build)
npm run build:cli    # Build + add shebang for CLI executable

# Development
npm run dev          # Start development server with Vite

# Testing
npm run test         # Run Vitest tests (watch mode)
npm run test:ci      # Run tests in CI mode (no watch)

# Single test file
npx vitest run tests/ApiHandler.test.ts

# Quality checks
npm run lint         # ESLint with Prettier
npm run lint -- --fix  # Auto-fix linting issues
npm run typecheck    # TypeScript type checking (tsc --noEmit)
```

## Code Style Guidelines

### File Headers

Every `.ts` file must include the MIT license header:

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
```

The one exception is `tests/docs-currency.test.ts` and any other file under `tests/`, per repo convention — the header rule applies to `src/`.

### Imports

- Use ES modules with `.js` extension in imports (required for bundled output)
- Use `import { thing } from './module.js'` not `import * as thing`
- Group imports: external packages first, then internal modules

### Formatting

- Run `npm run lint -- --fix` before committing (Prettier + ESLint)
- **Windows users**: Ensure line endings are LF, not CRLF, before committing
- The ESLint config ignores `tests/`, `dist/`, `bin/`, and `node_modules/`

### TypeScript

- Strict mode is enabled (`"strict": true` in tsconfig.json)
- Avoid `any` unless absolutely necessary (ESLint rule is `off` but discouraged)
- Use explicit return types on public functions
- Use interfaces for API response shapes (see `src/types.ts`)

### Naming Conventions

- **Files**: kebab-case (`openfda-builder.ts`)
- **Classes**: PascalCase (`OpenFDABuilder`)
- **Functions/variables**: camelCase (`makeOpenFDARequest`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Types/interfaces**: PascalCase (`OpenFDAResponse`, `EndpointDescriptor`)

### Error Handling

- Use typed errors via `OpenFDAError` interface in `src/types.ts`
- The `ApiHandler` categorizes errors as: `network`, `http`, `parsing`, `timeout`, `empty_response`, `unknown`
- `src/core/http.ts`'s `fetchPage()` further classifies an HTTP response into `hit` / `miss` (openFDA's zero-match 404) / `error` (a genuine upstream failure) — a zero-match search must never be reported as `isError: true`
- Tool handlers should return descriptive error messages with suggestions

### Zod Schemas

- Use Zod for all tool input validation
- A descriptor never writes a Zod schema by hand: `src/core/registry.ts`'s `buildInputSchema()` derives the schema from the descriptor's `fields`, `projections`, `sortFields` and `countFields`. `extraFilters.schema` is the one place a descriptor adds its own Zod fields, for parameters the built-in shape does not cover (e.g. `drug-event`'s `seriousness`).
- Use `.describe()` for field descriptions (useful for AI consumers)

## Architecture

### Entry Point

`src/index.ts` — MCP server initialization, transport connection, and one call to `registerDataset(toolManager, DRUG_ENDPOINTS)`. No tool handler lives here or anywhere else by hand: a handler is `execute(descriptor, input)` from `src/core/executor.ts`, closed over one `EndpointDescriptor`.

### Module Responsibilities

| Module | Responsibility |
| --- | --- |
| `src/index.ts` | MCP server setup; registers the drug API group |
| `src/core/descriptor.ts` | `EndpointDescriptor` — the extension-point contract; `validateDescriptor()` fails startup loudly on a malformed descriptor |
| `src/core/registry.ts` | `toToolDefinition()` / `registerDataset()` — builds a tool's Zod schema, description string and handler from a descriptor |
| `src/core/executor.ts` | `execute()` — the one request pipeline every tool's handler runs |
| `src/core/search/strategy.ts` | `SearchStrategy` / `planClauseSets()` — how a `field` name resolves to one or more clause sets |
| `src/core/search/query.ts` | `buildQuery()` — the only place an openFDA search string is assembled |
| `src/core/search/escape.ts` | `escapeSearchValue()` — escapes every caller value before it reaches a query string |
| `src/core/http.ts` | `fetchPage()` — one openFDA page request, classified into hit / miss / error |
| `src/core/shape/project.ts` | `applyProjection()` — projects a raw record through a descriptor's chosen `Projection` |
| `src/core/shape/envelope.ts` | `buildEnvelope()` — the one response envelope every endpoint returns |
| `src/core/shape/budget.ts` | `fitToBudget()` — caps a response at 60,000 characters, dropping trailing rows |
| `src/core/codes.ts` | `decodeTerm()` — decodes a coded aggregation term via a descriptor's `codeMaps` |
| `src/datasets/drug/index.ts` | `DRUG_ENDPOINTS` — the drug API group's descriptor array |
| `src/datasets/drug/label.ts`, `event.ts`, `drugsfda.ts` | One `EndpointDescriptor` each: `drug-label`, `drug-event`, `drug-drugsfda` |
| `src/datasets/drug/faers.ts`, `label-fields.ts` | FAERS code maps and label-field mapping shared by the descriptors above |
| `src/OpenFDABuilder.ts` | Fluent URL builder for the OpenFDA API |
| `src/ApiHandler.ts` | HTTP client with retry, exponential backoff, timeout |
| `src/ToolManager.ts` | Wraps `server.registerTool()`; enforces the API-key chokepoint |
| `src/types.ts` | TypeScript interfaces for OpenFDA API responses |
| `src/utils/env.ts`, `redact.ts`, `ndc.ts`, `ndc-formats.ts`, `format.ts` | API-key check, `api_key` redaction, NDC normalization/format messages, and `Showing N of M` formatting |
| `src/catalog/drug-<endpoint>.json` / `.coverage.json` | The committed, offline FDA field reference and coverage data every descriptor is checked against (`tests/catalog-conformance.test.ts`); regenerated by `npm run fields:sync` / `npm run fields:coverage` |

### Descriptor Pattern

A descriptor is data. No tool handler is hand-written; adding a tool means writing one `EndpointDescriptor` object and adding it to a dataset's array:

```typescript
export const drugLabel: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search FDA structured product labels (SPL) ...',
  fields: [
    { name: 'drug_name', description: '...', strategy: { kind: 'tiered', paths: [...] } },
    { name: 'ndc', description: '...', strategy: { kind: 'clauses', paths: [...], build: ndcClauses } },
    // ...
  ],
  defaultField: 'drug_name',
  projections: [
    { name: 'summary', description: '...', returnsFields: [...], project: (record) => ({ ... }) },
    { name: 'full', description: '...', returnsFields: ['record'], project: (record) => ({ record }) },
  ],
  sortFields: [],
  countFields: ['openfda.route', ...],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
};
```

`src/core/registry.ts`'s `toToolDefinition()` turns that object into the tool's Zod `inputSchema`, its description string, and a handler that is just `execute(descriptor, input)`. `validateDescriptor()` runs first and refuses to register a descriptor with structural problems (duplicate names, an empty strategy, a schema key that collides with a built-in parameter, `limits.default` above `limits.max`, and more).

### Executor Pipeline

Every registered tool's handler is `execute()` (`src/core/executor.ts`), run against its own descriptor:

1. Resolve `field` to a `FieldSpec`; validate and normalize `value` (a field's own `normalize`, e.g. NDC shape checking; `uppercase` for fields like `sponsor_name`).
2. Reject `skip` above openFDA's 25000 ceiling and `count` values not declared in the descriptor's `countFields`; resolve `detail` to a `Projection`.
3. Turn the field's `SearchStrategy` into one or more `ClauseSet`s (`core/search/strategy.ts`).
4. Assemble the query string via `buildQuery()` (`core/search/query.ts`), which escapes every value through `escapeSearchValue()` — the only place a search string is built, so escaping cannot be skipped.
5. Fetch a page via `fetchPage()` (`core/http.ts`), classified as `hit` / `miss` (a zero-match search — data, not an error) / `error` (a genuine upstream failure).
6. On a hit: project records through the chosen `Projection`, wrap them in the shared envelope (`matched_via`, `total`, `returned`, `limit`, `results`), and trim to the 60,000-character response budget, reporting how many rows were dropped. On `count`: decode ranked terms via `decodeTerm()` against the descriptor's `codeMaps`.

## Available Tools

- **`drug-label`** — Search FDA structured product labels (SPL). `field`: `drug_name`, `ndc`, `spl_product_data_elements`, `effective_time`, `id`, `set_id`, `brand_name`, `generic_name`, `substance_name`, `manufacturer_name`, `route`, `product_type`, `application_number`, `unii`, `rxcui`. `detail`: `summary` (default), `safety`, `full`. `count`: `openfda.route`, `openfda.product_type`, `openfda.manufacturer_name.exact`. `limit` default 1, max 25.
- **`drug-event`** — Search FAERS adverse event reports. `field`: `drug_name` (unions `patient.drug.openfda.generic_name`, `patient.drug.openfda.substance_name`, `patient.drug.medicinalproduct`), `brand_name`, `manufacturer_name`, `product_ndc`, `pharm_class`, `drug_characterization`, `indication`, `reaction`, `reaction_outcome`, `serious`, `seriousness_death`, `patient_sex`, `reporter_qualification`, `country`, `received_date`, `report_id`. `detail`: `summary` (default), `full`. `extraFilters`: `seriousness`. `sort`: `receivedate:desc`/`receivedate:asc`. `count`: `patient.reaction.reactionmeddrapt.exact`, `patient.reaction.reactionoutcome`, `serious`, `patient.patientsex`, `occurcountry.exact`, `patient.drug.openfda.generic_name.exact`. `limit` default 10, max 50.
- **`drug-drugsfda`** — Search Drugs@FDA application data. `field`: `application_number`, `sponsor_name`, `products.brand_name`, `products.active_ingredients.name`, `products.dosage_form`, `products.route`, `products.marketing_status`, `products.reference_drug`, `products.te_code`, `openfda.brand_name`, `openfda.generic_name`, `openfda.substance_name`, `openfda.manufacturer_name`, `openfda.route`, `openfda.product_ndc`, `submissions.submission_type`, `submissions.submission_status`, `submissions.submission_status_date`, `submissions.submission_class_code`, `submissions.review_priority`. `detail`: `summary` (default), `full`. `count`: `sponsor_name.exact`, `products.marketing_status`, `products.dosage_form`. `limit` default 5, max 100.

Four more (`drug-ndc`, `drug-enforcement`, `drug-orangebook`, `drug-shortages`) arrive in a later phase; each will be a new descriptor file plus one new line above.

## Testing Guidelines

### Test Structure

- Use Vitest with `vi.fn()` for mocking
- Mock `global.fetch` for API tests
- Test files: `<Module>.test.ts` in `tests/` directory (or `tests/core/`, `tests/datasets/` for the modules of the same name)

### Example Test Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('makeOpenFDARequest', () => {
  beforeEach(() => mockFetch.mockClear());

  it('should return data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    const { data, error } = await makeOpenFDARequest('http://test.com');
    expect(data).not.toBeNull();
    expect(error).toBeNull();
  });
});
```

## MCP SDK Notes

- Uses `@modelcontextprotocol/sdk` v1.29.0
- Server communicates via stdio transport
- The MCP SDK requires handlers to return `{ content: [...] }` structure
- Do NOT add `outputSchema` to tool registration - it causes validation errors
- See `src/ToolManager.ts` for current registration pattern
