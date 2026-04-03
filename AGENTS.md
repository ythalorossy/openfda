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
- **Types/interfaces**: PascalCase (`OpenFDAResponse`)

### Error Handling

- Use typed errors via `OpenFDAError` interface in `src/types.ts`
- The `ApiHandler` categorizes errors as: `network`, `http`, `parsing`, `timeout`, `empty_response`, `unknown`
- Tool handlers should return descriptive error messages with suggestions

### Zod Schemas

- Use Zod for all tool input validation (via `inputSchema`)
- Define schemas in tool definitions using `z.object({...})`
- Use `.describe()` for field descriptions (useful for AI consumers)

## Architecture

### Entry Point

`src/index.ts` - MCP server initialization, tool registration, transport connection

### Module Responsibilities

| Module                  | Responsibility                                       |
| ----------------------- | ---------------------------------------------------- |
| `src/index.ts`          | MCP server setup, tool definitions, handler logic    |
| `src/OpenFDABuilder.ts` | Fluent URL builder for OpenFDA API                   |
| `src/ApiHandler.ts`     | HTTP client with retry, exponential backoff, timeout |
| `src/ToolManager.ts`    | Wrapper around `server.registerTool()`               |
| `src/types.ts`          | TypeScript interfaces for OpenFDA API responses      |

### Tool Registration Pattern

```typescript
toolManager.registerTool({
  name: 'tool-name',
  description: 'Human-readable description for AI consumers',
  inputSchema: z.object({
    paramName: z.string().describe('Parameter description'),
  }),
  handler: async ({ paramName }) => {
    // Implementation
    return {
      content: [{ type: 'text', text: 'response text' }],
    };
  },
});
```

### API Request Flow

1. Tool handler receives parsed input
2. `OpenFDABuilder` constructs the API URL
3. `makeOpenFDARequest()` fetches with retry/exponential backoff
4. Handler formats response as MCP-compatible JSON text

### Available Tools

- `get-drug-by-name` - Search by brand name
- `get-drug-by-generic-name` - Search by active ingredient
- `get-drug-adverse-events` - Adverse event reports
- `get-drugs-by-manufacturer` - Drugs by company
- `get-drug-safety-info` - Warnings, contraindications, interactions
- `get-drug-by-ndc` - Search by National Drug Code
- `get-drug-by-product-ndc` - Search by product NDC only

## Testing Guidelines

### Test Structure

- Use Vitest with `vi.fn()` for mocking
- Mock `global.fetch` for API tests
- Test files: `<Module>.test.ts` in `tests/` directory

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
