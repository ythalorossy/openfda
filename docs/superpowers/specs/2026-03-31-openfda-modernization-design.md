# OpenFDA MCP Server Modernization Design

## Overview

Modernize the `@ythalorossy/openfda` NPM package by updating dependencies, reorganizing code structure, adopting Vite + Vitest for build/test, and ensuring best practices for a published NPM package.

## Project Structure

```
openfda/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── ApiHandler.ts      # HTTP client for OpenFDA API
│   ├── OpenFDABuilder.ts  # URL builder for API requests
│   ├── ToolManager.ts     # MCP tool registration helper
│   └── types.ts           # TypeScript interfaces
├── tests/
│   ├── ApiHandler.test.ts
│   ├── OpenFDABuilder.test.ts
│   └── ToolManager.test.ts
├── dist/                  # Compiled output (replaces build/)
├── bin/                   # CLI entry point
├── docs/
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

**Changes from current:**
- Test files moved from `src/*.test.ts` → `tests/*.test.ts`
- Output directory changed from `build/` → `dist/`

## Tooling Configuration

### Vite (Build)
- Use `vite` with TypeScript plugin
- Entry point: `src/index.ts`
- Output: `dist/` (ESM format)
- CLI bin copied to `bin/` post-build via `vite build` + custom script

### Vitest (Testing)
- Unit tests only (no integration/API calls)
- Mock `makeOpenFDARequest` for API tests
- Fast execution, CI-friendly

### TypeScript
- Target: ES2022
- Module: ESNext / bundler - let Vite handle module resolution
- Strict mode enabled
- ESM-first (`"type": "module"` in package.json)

### ESLint + Prettier
- Keep existing configs (`.eslintrc.cjs`, `.prettierrc`)
- Update to work with new structure

## Dependency Updates

### Core Dependencies
| Package | Current | Updated |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.15.1` | `^1.29.0` |
| `zod` | `^3.25.76` | `^3.25.0` (check latest) |

### Dev Dependencies (Replace with Vite/Vitest)
**Remove:**
- `typescript`
- `ts-jest`
- `jest`
- `@types/jest`
- `@types/node`

**Add:**
- `vite`
- `vitest`
- `@vitest/coverage-v8`
- `tsx` (for running TypeScript directly)

**Keep existing:**
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-config-prettier`
- `eslint-plugin-prettier`
- `prettier`
- `shx`

## MCP SDK API (1.15.1 → 1.29.0)

When upgrading the SDK, the `server.tool()` registration API may have changed. The code currently uses a workaround (passing `schema.shape` instead of `schema`) due to a bug in 1.15.1.

**Approach:** Investigate the 1.29.0 SDK API and update the code accordingly. If the bug is fixed, pass `schema` directly. If not, maintain the workaround.

**Known areas to check:**
- `ToolManager.ts` - tool registration pattern
- `src/index.ts` - how tools are registered

## Testing Strategy

### Unit Tests
| Test File | What to Test |
|-----------|--------------|
| `tests/ApiHandler.test.ts` | Mock `fetch`, test retry logic, exponential backoff, error handling, timeout |
| `tests/OpenFDABuilder.test.ts` | Test URL construction, context, search, limit |
| `tests/ToolManager.test.ts` | Test tool registration with mocked SDK |

### Test Approach
- Mock external dependencies (fetch, OpenFDA API)
- No real network calls in unit tests
- Review and modernize existing tests where applicable
- Create new tests as needed for coverage

### Future (Out of Scope)
- Integration tests under `tests/integration/`
- Would require `OPENFDA_API_KEY` in CI environment

## CI/CD

### GitHub Actions Workflow (`.github/workflows/ci.yml`)
- Run on Node.js 18, 20, 22
- Steps: lint → typecheck → test → build

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:ci": "vitest run",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "prepare": "npm run build"
  }
}
```

## Implementation Order

1. Create Vite and Vitest configuration
2. Update TypeScript configuration
3. Update dependencies in package.json
4. Reorganize test files to `tests/`
5. Update MCP SDK and investigate API changes
6. Fix ToolManager for new SDK API
7. Update/create tests
8. Update GitHub Actions workflow
9. Verify build and test execution
