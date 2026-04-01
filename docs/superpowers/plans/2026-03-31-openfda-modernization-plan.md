# OpenFDA MCP Server Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the OpenFDA MCP server by updating dependencies, adopting Vite + Vitest, reorganizing code structure, and ensuring best practices for a published NPM package.

**Architecture:** Transform from a TypeScript + Jest + tsc setup to a Vite + Vitest build/test stack. Test files moved from `src/*.test.ts` to `tests/*.test.ts`. Output directory changed from `build/` to `dist/`. MCP SDK upgraded from 1.15.1 to 1.29.0.

**Tech Stack:** Vite, Vitest, TypeScript, @modelcontextprotocol/sdk 1.29.0, zod, ESLint, Prettier

---

## File Structure After Modernization

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

---

## Task 1: Create Vite Configuration

**Files:**
- Create: `vite.config.ts`
- Modify: `package.json` (scripts update in Task 4)

- [ ] **Step 1: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OpenFDA',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk', 'zod'],
      output: {
        dir: 'dist',
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 2: Verify config is valid**

Run: `npx vite --version`
Expected: Vite version output (e.g., "5.x.x")

---

## Task 2: Create Vitest Configuration

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 2: Verify config is valid**

Run: `npx vitest --version`
Expected: Vitest version output (e.g., "2.x.x")

---

## Task 3: Update TypeScript Configuration

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests", "dist"]
}
```

**Key changes:**
- Changed `module` from `Node16` to `ESNext`
- Changed `moduleResolution` from `Node16` to `bundler`
- Added `noEmit: true` (Vite handles compilation)
- Added `isolatedModules: true` (required for Vite)
- Added `resolveJsonModule: true`
- Excluded `tests` and `dist` from compilation

---

## Task 4: Update Package.json Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json with new dependencies**

```json
{
  "name": "@ythalorossy/openfda",
  "version": "1.0.12",
  "description": "OpenFDA Model Context Protocol",
  "repository": {
    "type": "git",
    "url": "https://github.com/ythalorossy/openfda.git"
  },
  "author": "Ythalo Saldanha",
  "license": "MIT",
  "type": "module",
  "bin": {
    "openfda": "./bin/index.js"
  },
  "files": [
    "dist",
    "bin"
  ],
  "keywords": [
    "openfda",
    "drugs",
    "mcp",
    "server"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build && chmod 755 dist/index.js && shx mkdir -p bin && shx cp dist/index.js bin/",
    "test": "vitest",
    "test:ci": "vitest run",
    "lint": "eslint . --ext .ts",
    "typecheck": "tsc --noEmit",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "shx": "^0.3.4",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

**Key changes:**
- `files`: changed `build` to `dist`
- Removed: `jest`, `@types/jest`, `ts-jest`, `@types/node`
- Added: `vite`, `vitest`, `tsx`
- Updated: `@modelcontextprotocol/sdk` to `^1.29.0`, ESLint to v9
- Removed redundant versions (jest@30 doesn't exist, use latest)

- [ ] **Step 2: Run npm install to update dependencies**

Run: `npm install`
Expected: Installs new packages, removes old ones

- [ ] **Step 3: Verify vite and vitest are installed**

Run: `npx vite --version && npx vitest --version`
Expected: Both commands output version numbers

---

## Task 5: Move Test Files to tests/ Directory

**Files:**
- Create: `tests/ApiHandler.test.ts`
- Create: `tests/OpenFDABuilder.test.ts`
- Create: `tests/ToolManager.test.ts` (new file)
- Delete: `src/ApiHandler.test.ts`
- Delete: `src/OpenFDABuilder.test.ts`

- [ ] **Step 1: Create tests directory**

Run: `mkdir -p tests`

- [ ] **Step 2: Copy and modernize ApiHandler.test.ts**

Copy from `src/ApiHandler.test.ts` to `tests/ApiHandler.test.ts` with these modernizations:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeOpenFDARequest } from '../src/ApiHandler';
import type { OpenFDAError } from '../src/types';

// Mock fetch using Vi
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('makeOpenFDARequest', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should return data on a successful request', async () => {
    const mockData = { results: [{ id: '123' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { data, error } = await makeOpenFDARequest('http://test.com');
    expect(data).toEqual(mockData);
    expect(error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return an http error on a failed request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Error message',
    });

    const { data, error } = await makeOpenFDARequest('http://test.com');
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.type).toBe('http');
    expect(error?.status).toBe(404);
  });

  it('should retry on a 500 error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => 'Server error',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

    const { data, error } = await makeOpenFDARequest('http://test.com', { maxRetries: 1, retryDelay: 10 });
    expect(data).not.toBeNull();
    expect(error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle a network error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { data, error } = await makeOpenFDARequest('http://test.com', { maxRetries: 0 });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.type).toBe('network');
  });

  it('should handle a timeout', async () => {
    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      });
    });

    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

    const { data, error } = await makeOpenFDARequest('http://test.com', { timeout: 50 });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(abortSpy).toHaveBeenCalled();
  });
});
```

**Changes from Jest to Vitest:**
- `jest.fn()` → `vi.fn()`
- `jest.spyOn()` → `vi.spyOn()`
- `jest.clearAllMocks()` → `mockFetch.mockClear()` in `beforeEach`
- `describe`/`it`/`expect` from Vitest globals (no imports needed)
- Removed `jest.resetModules()` pattern (not needed with Vitest)

- [ ] **Step 3: Copy and modernize OpenFDABuilder.test.ts**

Copy from `src/OpenFDABuilder.test.ts` to `tests/OpenFDABuilder.test.ts` with modernizations:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenFDABuilder } from '../src/OpenFDABuilder';

describe('OpenFDABuilder', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should build a valid URL with all parameters', () => {
    const url = new OpenFDABuilder()
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .limit(5)
      .build();
    expect(url).toBe('https://api.fda.gov/drug/label.json?api_key=TEST_API_KEY&search=openfda.brand_name:"Advil"&limit=5');
  });

  it('should use a default limit of 1 if not specified', () => {
    const url = new OpenFDABuilder()
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .build();
    expect(url).toContain('&limit=1');
  });

  it('should throw an error if context is not set', () => {
    expect(() => {
      new OpenFDABuilder()
        .search('test')
        .limit(1)
        .build();
    }).toThrow('Missing required parameters: context or search');
  });

  it('should throw an error if search is not set', () => {
    expect(() => {
      new OpenFDABuilder()
        .context('label')
        .limit(1)
        .build();
    }).toThrow('Missing required parameters: context or search');
  });

  it('should handle a limit of 0', () => {
    const url = new OpenFDABuilder()
      .context('label')
      .search('some_query')
      .limit(0)
      .build();
    expect(url).toContain('&limit=0');
  });

  it('should include undefined in URL if API key is missing', () => {
    // Note: Current behavior passes undefined as string. Consider fixing in separate PR.
    delete process.env.OPENFDA_API_KEY;
    const builder = new OpenFDABuilder()
      .context('label')
      .search('some_query')
      .limit(1);
    const url = builder.build();
    expect(url).toBe('https://api.fda.gov/drug/label.json?api_key=undefined&search=some_query&limit=1');
  });
});
```

- [ ] **Step 4: Create ToolManager.test.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolManager } from '../src/ToolManager';

// Mock the McpServer tool method
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    tool: vi.fn(),
    connect: vi.fn(),
  })),
}));

describe('ToolManager', () => {
  let server: McpServer;
  let toolManager: ToolManager;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    toolManager = new ToolManager(server);
  });

  it('should register a tool with the server', () => {
    const toolDef = {
      name: 'test-tool',
      description: 'A test tool',
      schema: z.object({
        input: z.string().describe('An input'),
      }),
      handler: async ({ input }: { input: string }) => ({
        content: [{ type: 'text' as const, text: `Got: ${input}` }],
      }),
    };

    toolManager.registerTool(toolDef);

    // Verify server.tool was called
    expect(server.tool).toHaveBeenCalledTimes(1);
    expect(server.tool).toHaveBeenCalledWith(
      'test-tool',
      'A test tool',
      expect.objectContaining({
        input: expect.any(Object),
      }),
      expect.any(Function)
    );
  });

  it('should pass schema.shape to server.tool (SDK workaround)', () => {
    const toolDef = {
      name: 'test-tool',
      description: 'A test tool',
      schema: z.object({
        name: z.string(),
      }),
      handler: async () => ({ content: [] }),
    };

    toolManager.registerTool(toolDef);

    // The second argument to server.tool should be the schema
    const toolCall = (server.tool as ReturnType<typeof vi.fn>).mock.calls[0];
    // server.tool(name, description, schema, handler)
    // schema should be passed directly, not wrapped
    expect(toolCall[2]).toBeDefined();
  });
});
```

- [ ] **Step 5: Delete old test files from src/**

Run: `rm src/ApiHandler.test.ts src/OpenFDABuilder.test.ts`

- [ ] **Step 6: Verify tests directory structure**

Run: `ls -la tests/`
Expected: `ApiHandler.test.ts`, `OpenFDABuilder.test.ts`, `ToolManager.test.ts`

---

## Task 6: Update ToolManager for MCP SDK 1.29.0

**Files:**
- Modify: `src/ToolManager.ts`
- Modify: `src/index.ts` (if needed after SDK investigation)

- [ ] **Step 1: Investigate MCP SDK 1.29.0 API**

The MCP SDK 1.29.0 may have changed the `server.tool()` API. Check if:
- The double-wrapping bug still exists
- The `tool()` method signature has changed
- The `schema.shape` workaround is still needed

Run: `cat node_modules/@modelcontextprotocol/sdk/package.json | grep '"version"'`

If SDK 1.29.0 is installed, check the SDK source for the tool method:
- Look at `node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js` or `.../esm/server/mcp.js`
- Search for `tool(` method definition
- Check how it handles the schema parameter

- [ ] **Step 2: Update ToolManager.ts based on SDK investigation**

Based on investigation, update `src/ToolManager.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

type ToolDefinition<T extends z.ZodObject<any>> = {
  name: string;
  description: string;
  schema: T;
  handler: (
    input: z.infer<T>
  ) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

class ToolManager {
  constructor(private server: McpServer) {}

  registerTool<T extends z.ZodObject<any>>(definition: ToolDefinition<T>) {
    // Pass schema.shape to avoid SDK double-wrapping issue (if bug still exists)
    // If SDK bug is fixed, pass definition.schema directly
    this.server.tool(
      definition.name,
      definition.description,
      definition.schema.shape,
      definition.handler
    );
  }
}

export { ToolManager };
```

- [ ] **Step 3: Verify ToolManager compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to ToolManager

---

## Task 7: Update src/index.ts for SDK 1.29.0

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Review index.ts for SDK compatibility**

Check if `src/index.ts` needs updates for SDK 1.29.0. The main areas to check:
- `McpServer` constructor options
- `StdioServerTransport` import and usage
- Tool registration patterns

- [ ] **Step 2: Verify index.ts compiles**

Run: `npx tsc --noEmit`
Expected: No errors

---

## Task 8: Run Tests and Fix Any Issues

**Files:**
- All modified files from previous tasks

- [ ] **Step 1: Run vitest to see current state**

Run: `npx vitest run`
Expected: Tests run, some may fail initially

- [ ] **Step 2: Fix test failures**

Fix any issues found during test execution. Common issues:
- Import paths (now `../src/...` from `tests/`)
- Mock patterns for Vitest vs Jest
- Async handling differences

- [ ] **Step 3: Verify all tests pass**

Run: `npx vitest run`
Expected: All tests pass

---

## Task 9: Verify Build Works

**Files:**
- All source files

- [ ] **Step 1: Run vite build**

Run: `npm run build`
Expected: Build completes, `dist/` directory created

- [ ] **Step 2: Verify dist contents**

Run: `ls -la dist/`
Expected: Contains compiled JS files

- [ ] **Step 3: Verify bin/ is updated**

Run: `ls -la bin/`
Expected: Contains CLI entry point

- [ ] **Step 4: Verify CLI works**

Run: `node bin/index.js --help` (or test with JSON-RPC ping)
Expected: Server starts without errors

---

## Task 10: Update GitHub Actions CI Workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Update ci.yml for new tooling**

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['18.x', '20.x', '22.x']

    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:ci
      - run: npm run build

```

**Key changes:**
- Updated `actions/checkout@v3` → `v4`
- Updated `actions/setup-node@v3` → `v4`
- Added `cache: 'npm'` for faster installs
- Added matrix strategy for Node 18, 20, 22
- Added `typecheck` step
- Changed `npm test` to `npm run test:ci`
- Added explicit `npm run build` step

- [ ] **Step 2: Verify workflow syntax**

Run: `npx yaml-read .github/workflows/ci.yml` or manually inspect
Expected: Valid YAML

---

## Task 11: Final Verification

- [ ] **Step 1: Run full verification**

Run all these commands and verify expected output:

```bash
# Type check
npm run typecheck
# Expected: No errors

# Lint
npm run lint
# Expected: No errors (or only warnings)

# Test
npm run test:ci
# Expected: All tests pass

# Build
npm run build
# Expected: dist/ directory created

# CLI test (requires OPENFDA_API_KEY env var)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | OPENFDA_API_KEY=test node bin/index.js 2>/dev/null | head -c 200
# Expected: JSON response with tools list
```

- [ ] **Step 2: Clean up build artifacts not needed in npm package**

Check `files` array in `package.json` includes only `dist/` and `bin/`, not `build/` or `node_modules/`.

---

## Task 12: Commit Changes

- [ ] **Step 1: Stage all changes**

Run: `git add -A`

- [ ] **Step 2: Commit with descriptive message**

```bash
git commit -m "$(cat <<'EOF'
feat: modernize build system with Vite + Vitest

- Replace tsc + Jest with Vite + Vitest for build and test
- Update @modelcontextprotocol/sdk from 1.15.1 to 1.29.0
- Move test files from src/ to tests/ directory
- Change output directory from build/ to dist/
- Update GitHub Actions CI to test Node 18, 20, 22
- Add typecheck step to CI pipeline

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Implementation Notes

### SDK 1.29.0 Investigation Checklist

When investigating the SDK upgrade, verify:
1. Does `server.tool(name, description, schema, handler)` still work?
2. Does the schema double-wrapping bug still exist?
3. Are there any new API methods for tool registration?
4. Does `StdioServerTransport` still work the same way?

### Import Path Changes

With the move to `tests/` directory:
- `src/ApiHandler.ts` → imported as `'../src/ApiHandler'` from `tests/`
- `src/types.ts` → imported as `'../src/types'` from `tests/`

### Vitest vs Jest Differences

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.mock()` | `vi.mock()` |
| `beforeAll`/`afterAll` | Same |
| `describe`/`it`/`expect` | Same (globals) |

### File Dependency Map

```
vite.config.ts ──────────────────────► package.json
vitest.config.ts ────────────────────► package.json
tsconfig.json ────────────────────────► package.json
package.json ────────────────────────► node_modules/
src/ToolManager.ts ──────────────────► @modelcontextprotocol/sdk, zod
src/index.ts ─────────────────────────► @modelcontextprotocol/sdk, ToolManager, ApiHandler
src/ApiHandler.ts ───────────────────► types
src/OpenFDABuilder.ts ────────────────► (no dependencies)
tests/ApiHandler.test.ts ────────────► src/ApiHandler, src/types
tests/OpenFDABuilder.test.ts ────────► src/OpenFDABuilder
tests/ToolManager.test.ts ──────────► src/ToolManager, @modelcontextprotocol/sdk
.github/workflows/ci.yml ────────────► (no file deps, triggers CI)
```
