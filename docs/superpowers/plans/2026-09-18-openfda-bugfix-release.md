# openFDA MCP 1.1.0 Bug-Fix Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the API-key leak, the misleading missing-key failure, the missing
`boxed_warning`/PLR warning fields, NDC format rejection, absent result totals,
and brand-name resolution gaps in the openFDA MCP server.

**Architecture:** Four small shared modules each fix a bug *class* once —
`utils/redact.ts` (secret hygiene), `utils/env.ts` + a `ToolManager` guard (key
policy), `drug/label-fields.ts` (label mapping), `drug/resolve-label.ts` (tiered
lookup) — plus `utils/format.ts` for result totals. Handlers get thinner and
never hold a URL, which makes the P0-1 leak structurally impossible rather than
patched in four places.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Zod, Vitest, Vite,
`@modelcontextprotocol/sdk`.

**Spec:** `docs/superpowers/specs/2026-09-18-openfda-bugfix-design.md`

## Global Constraints

- Fix in `src/`, never in `dist/`. `npm run build` to verify compilation.
- Do not invent openFDA field names. Verified names for this work:
  `boxed_warning`, `warnings_and_cautions` (**not** `warnings_and_precautions`),
  `spl_product_data_elements`, `meta.results.total`,
  `patient.reaction[].reactionoutcome`.
- Never interpolate a built URL into user-facing `text:` output.
- Never log or echo the API key.
- All imports between local modules use the `.js` extension (ESM).
- Existing file header comment block (`Copyright (c) 2025 Ythalo Saldanha` /
  `Licensed under the MIT License`) goes at the top of every new `src/` file.
- Tests are offline: stub `fetch`, use committed fixtures, never hit the network
  in the suite. The one exception is the fixture-capture script, run manually.
- Verification commands: `npm run test:ci`, `npm run typecheck`, `npm run lint`.
- Target version `1.1.0` (minor — output shape changes).

## A note on line numbers

Line references point at the **pre-change** state of each file and will drift as
earlier tasks land. Locate the code by the quoted content, not by the number.

## File Structure

**Create:**

- `src/utils/redact.ts` — `redactApiKey`. Secret hygiene only.
- `src/utils/env.ts` — key policy: present / keyless-opt-in / missing.
- `src/utils/format.ts` — result-total formatting for list responses.
- `src/drug/label-fields.ts` — one label-field mapper shared by two tools.
- `src/drug/resolve-label.ts` — tiered brand/generic/substance/SPL lookup.
- `src/drug/faers.ts` — FAERS enumeration maps (outcome codes).
- `tests/fixtures/*.json` — captured, trimmed openFDA responses.
- `tests/helpers/stubFetch.ts` — shared `fetch` stub.
- `scripts/capture-fixtures.mjs` — manual, network-using fixture capture.

**Modify:**

- `src/OpenFDABuilder.ts:60-72` — `URLSearchParams`, conditional `api_key`.
- `src/ToolManager.ts:25-34` — wrap handler with the key guard.
- `src/index.ts` — one-time startup stderr warning.
- `src/types.ts:25-55` — add `boxed_warning`, `warnings_and_cautions`.
- `src/utils/ndc.ts:29-42` — widen accepted NDC forms.
- `src/drug/get-drug-by-name.ts:34` — remove URL leak; use shared mapper.
- `src/drug/get-drugsfda.ts:53` — remove URL leak.
- `src/drug/get-drug-by-product-ndc.ts:18,45` — remove URL leak, use shared NDC helper.
- `src/drug/get-drugs-by-manufacturer.ts:44,74` — remove URL leak, add totals.
- `src/drug/get-drug-by-generic-name.ts:74` — add totals.
- `src/drug/get-drug-adverse-events.ts:38,86-99` — ` AND `, outcomes, dedupe, totals.
- `src/drug/get-drug-safety-info.ts:52-65` — use shared mapper + tiered resolve.
- `tests/OpenFDABuilder.test.ts:58-69` — **replace** the test that asserts the bug.
- `README.md` — `-y` arg, `get-drugsfda`, `.env` correction.
- `package.json` — version `1.1.0`.

---

### Task 1: Stop leaking the API key (P0-1)

**Files:**
- Create: `src/utils/redact.ts`
- Create: `tests/redact.test.ts`
- Create: `tests/no-url-in-output.test.ts`
- Modify: `src/drug/get-drugsfda.ts:53`
- Modify: `src/drug/get-drug-by-name.ts:34`
- Modify: `src/drug/get-drug-by-product-ndc.ts:45`
- Modify: `src/drug/get-drugs-by-manufacturer.ts:44`

**Interfaces:**
- Consumes: nothing.
- Produces: `redactApiKey(input: string): string` from `src/utils/redact.ts`.

- [ ] **Step 1: Write the failing test for `redactApiKey`**

Create `tests/redact.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { redactApiKey } from '../src/utils/redact';

describe('redactApiKey', () => {
  it('redacts the key when it is the first query parameter', () => {
    const input =
      'https://api.fda.gov/drug/label.json?api_key=SECRET123&search=x&limit=1';
    expect(redactApiKey(input)).toBe(
      'https://api.fda.gov/drug/label.json?api_key=<REDACTED>&search=x&limit=1'
    );
  });

  it('redacts the key when it is a later query parameter', () => {
    const input = 'https://api.fda.gov/drug/label.json?search=x&api_key=SECRET123';
    expect(redactApiKey(input)).toBe(
      'https://api.fda.gov/drug/label.json?search=x&api_key=<REDACTED>'
    );
  });

  it('redacts a key embedded mid-sentence without eating following prose', () => {
    const input = 'Request to ?api_key=SECRET123 failed with 500';
    expect(redactApiKey(input)).toBe('Request to ?api_key=<REDACTED> failed with 500');
  });

  it('is case-insensitive about the parameter name', () => {
    expect(redactApiKey('?API_KEY=SECRET123')).toBe('?API_KEY=<REDACTED>');
  });

  it('leaves strings without a key untouched', () => {
    expect(redactApiKey('no secrets here')).toBe('no secrets here');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/redact.test.ts`
Expected: FAIL — cannot resolve `../src/utils/redact`.

- [ ] **Step 3: Implement `redactApiKey`**

Create `src/utils/redact.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Replace the value of any `api_key` query parameter with `<REDACTED>`.
 *
 * Use this anywhere a string that might contain a built openFDA URL could
 * reach a log, an error message, or tool output. Tool output flows into LLM
 * context and transcripts, so a leaked key there is a leaked key on disk.
 */
export const redactApiKey = (input: string): string =>
  input.replace(/([?&]api_key=)[^&\s]*/gi, '$1<REDACTED>');
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run tests/redact.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing recurrence-guard test**

This is the test that stops the leak coming back. Create
`tests/no-url-in-output.test.ts`:

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

describe('source hygiene', () => {
  it('never interpolates a url variable into user-facing text', () => {
    const offenders = sourceFiles('src').filter((file) => {
      const source = readFileSync(file, 'utf8');
      // A `url` (or `...Url`) variable interpolated anywhere in the file's
      // template literals is the shape that leaked the key in 1.0.19.
      return /\$\{\s*[A-Za-z]*[uU]rl\s*\}/.test(source);
    });
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 6: Run it and confirm it fails with all four offenders**

Run: `npx vitest run tests/no-url-in-output.test.ts`
Expected: FAIL, listing `src/drug/get-drugsfda.ts`,
`src/drug/get-drug-by-name.ts`, `src/drug/get-drug-by-product-ndc.ts`,
`src/drug/get-drugs-by-manufacturer.ts`.

- [ ] **Step 7: Remove the URL from `get-drugsfda.ts:53`**

Change:

```ts
      let errorMessage = `${url} Failed to retrieve drugsfda data for "${searchValue}" in ${sectionName}.${fieldName}: ${error.message}`;
```

to:

```ts
      let errorMessage = `Failed to retrieve drugsfda data for "${searchValue}" in ${sectionName}.${fieldName}: ${error.message}`;
```

- [ ] **Step 8: Remove the URL from `get-drug-by-name.ts:34`**

Change:

```ts
            errorMessage += `${url}\n\nSuggestions:\n- Verify the exact brand name spelling\n- Try searching for the generic name instead\n- Check if the drug is FDA-approved`;
```

to:

```ts
            errorMessage += `\n\nSuggestions:\n- Verify the exact brand name spelling\n- Try searching for the generic name instead\n- Check if the drug is FDA-approved`;
```

- [ ] **Step 9: Remove the URL from `get-drug-by-product-ndc.ts:45`**

Change:

```ts
            text: `${url}Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
```

to:

```ts
            text: `Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
```

- [ ] **Step 10: Remove the URL from `get-drugs-by-manufacturer.ts:44`**

Change:

```ts
            text: `${url}\nFailed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
```

to:

```ts
            text: `Failed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
```

- [ ] **Step 10b: Add an end-to-end assertion that tool output carries no key**

The source scan catches the `${url}` shape; this catches the *behaviour*
regardless of shape. Append to `tests/no-url-in-output.test.ts`:

```ts
import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc';
import { beforeEach, afterEach, vi } from 'vitest';

describe('tool error output', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'SUPERSECRETKEY' };
    // Force the upstream-error path, which is where the key leaked.
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    })) as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('never contains the api key or the api_key parameter on an error', async () => {
    const result = await getDrugByProductNdc.handler({
      productNDC: '12345-1234',
    });
    const text = result.content[0].text;

    expect(text).not.toContain('SUPERSECRETKEY');
    expect(text).not.toContain('api_key');
    expect(text).not.toContain('api.fda.gov');
  });
});
```

Run: `npx vitest run tests/no-url-in-output.test.ts`
Expected: PASS once Steps 7-10 are applied. This test takes a few seconds
because `makeOpenFDARequest` retries 5xx with exponential backoff.

- [ ] **Step 11: Run the guard and the whole suite**

Run: `npx vitest run tests/no-url-in-output.test.ts && npm run test:ci && npm run typecheck`
Expected: guard PASSES; full suite passes; typecheck clean.

Note: removing `${url}` may leave `url` assigned but unused in some handlers.
That is fine — it is still passed to `makeOpenFDARequest`. If `lint` reports a
genuinely unused variable, delete the binding and inline the builder call.

- [ ] **Step 12: Commit**

```bash
git add src/utils/redact.ts tests/redact.test.ts tests/no-url-in-output.test.ts \
  src/drug/get-drugsfda.ts src/drug/get-drug-by-name.ts \
  src/drug/get-drug-by-product-ndc.ts src/drug/get-drugs-by-manufacturer.ts
git commit -m "fix: stop leaking OPENFDA_API_KEY in tool error output

Four handlers interpolated the built request URL — which contains
api_key=<live key> — into user-facing error text. Tool output flows into
LLM context and transcripts, so every user leaked their own key on any
upstream error.

Adds redactApiKey for future logging paths and a source-scan test that
fails if a url variable is ever interpolated into output again.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Fail fast on a missing API key (P0-2, part 1)

**Files:**
- Create: `src/utils/env.ts`
- Create: `tests/helpers/stubFetch.ts`
- Create: `tests/env.test.ts`
- Create: `tests/ToolManager.keyguard.test.ts`
- Modify: `src/ToolManager.ts:25-34`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ApiKeyStatus = { ok: true; apiKey: string | null } | { ok: false; message: string }`
  - `checkApiKey(env?: NodeJS.ProcessEnv): ApiKeyStatus`
  - `MISSING_KEY_MESSAGE: string`
  - `warnIfKeyless(env?: NodeJS.ProcessEnv): void`
  - all from `src/utils/env.ts`.
  - `stubFetch(responses: unknown[]): { calls: string[]; restore: () => void }`
    from `tests/helpers/stubFetch.ts`.

- [ ] **Step 1: Write the failing test for `checkApiKey`**

Create `tests/env.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { checkApiKey, MISSING_KEY_MESSAGE } from '../src/utils/env';

describe('checkApiKey', () => {
  it('accepts a present key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: 'abc' })).toEqual({
      ok: true,
      apiKey: 'abc',
    });
  });

  it('trims surrounding whitespace from the key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: '  abc  ' })).toEqual({
      ok: true,
      apiKey: 'abc',
    });
  });

  it('rejects an absent key with an actionable message', () => {
    const status = checkApiKey({});
    expect(status.ok).toBe(false);
    expect(status).toHaveProperty('message', MISSING_KEY_MESSAGE);
  });

  it('rejects an empty or whitespace-only key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: '' }).ok).toBe(false);
    expect(checkApiKey({ OPENFDA_API_KEY: '   ' }).ok).toBe(false);
  });

  it('allows the keyless tier only when explicitly opted in', () => {
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: '1' })).toEqual({
      ok: true,
      apiKey: null,
    });
  });

  it('does not treat other OPENFDA_ALLOW_KEYLESS values as opt-in', () => {
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: 'true' }).ok).toBe(false);
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: '0' }).ok).toBe(false);
  });

  it('prefers a real key over the keyless opt-in', () => {
    expect(
      checkApiKey({ OPENFDA_API_KEY: 'abc', OPENFDA_ALLOW_KEYLESS: '1' })
    ).toEqual({ ok: true, apiKey: 'abc' });
  });

  it('never includes the key in the missing-key message', () => {
    expect(MISSING_KEY_MESSAGE).not.toMatch(/abc/);
    expect(MISSING_KEY_MESSAGE).toContain('OPENFDA_API_KEY is not set');
    expect(MISSING_KEY_MESSAGE).toContain('.env file is not loaded');
    expect(MISSING_KEY_MESSAGE).toContain('OPENFDA_ALLOW_KEYLESS=1');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run tests/env.test.ts`
Expected: FAIL — cannot resolve `../src/utils/env`.

- [ ] **Step 3: Implement `src/utils/env.ts`**

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export type ApiKeyStatus =
  | { ok: true; apiKey: string | null }
  | { ok: false; message: string };

export const MISSING_KEY_MESSAGE =
  'OPENFDA_API_KEY is not set. This server reads the key from its process ' +
  'environment; a .env file is not loaded. Add it to the "env" block of your ' +
  'MCP client configuration. Get a free key at ' +
  'https://open.fda.gov/apis/authentication/\n\n' +
  'To run without a key on the unauthenticated tier (40 requests/minute, ' +
  '1,000/day per IP, and no rate-limit headers), set OPENFDA_ALLOW_KEYLESS=1.';

export const KEYLESS_WARNING =
  'openfda: OPENFDA_ALLOW_KEYLESS=1 — using the unauthenticated tier ' +
  '(40 requests/minute, no rate-limit visibility). Set OPENFDA_API_KEY for ' +
  '240 requests/minute.';

export const MISSING_KEY_WARNING =
  'openfda: OPENFDA_API_KEY is not set; every tool call will return a ' +
  'configuration error. See https://open.fda.gov/apis/authentication/';

/**
 * Decide whether a request may be made, and with which key.
 *
 * A missing key fails fast rather than silently falling back to the keyless
 * tier: keyless returns no rate-limit headers, so exhausting it surfaces as
 * slow, intermittent 429 retries rather than a clear error.
 */
export function checkApiKey(
  env: NodeJS.ProcessEnv = process.env
): ApiKeyStatus {
  const apiKey = env.OPENFDA_API_KEY?.trim();
  if (apiKey) return { ok: true, apiKey };
  if (env.OPENFDA_ALLOW_KEYLESS === '1') return { ok: true, apiKey: null };
  return { ok: false, message: MISSING_KEY_MESSAGE };
}

/** Emit a one-time startup notice to stderr. Never logs the key itself. */
export function warnIfKeyless(env: NodeJS.ProcessEnv = process.env): void {
  const status = checkApiKey(env);
  if (!status.ok) console.error(MISSING_KEY_WARNING);
  else if (status.apiKey === null) console.error(KEYLESS_WARNING);
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run tests/env.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Create the shared fetch stub helper**

Create `tests/helpers/stubFetch.ts`:

```ts
import { vi } from 'vitest';

/**
 * Replace global fetch with a stub that returns the given JSON payloads in
 * order. Returns the list of requested URLs so a test can assert both what
 * was requested and that nothing was requested at all.
 */
export function stubFetch(responses: unknown[]): {
  calls: string[];
  restore: () => void;
} {
  const calls: string[] = [];
  let index = 0;
  const original = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: any) => {
    calls.push(String(input));
    const body = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => body,
    } as any;
  }) as any;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
```

- [ ] **Step 6: Write the failing guard test**

Create `tests/ToolManager.keyguard.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToolManager } from '../src/ToolManager';
import { MISSING_KEY_MESSAGE } from '../src/utils/env';
import { stubFetch } from './helpers/stubFetch';
import z from 'zod';

function fakeServer() {
  const registered: Record<string, (input: unknown) => Promise<any>> = {};
  return {
    registered,
    registerTool: (name: string, _config: unknown, handler: any) => {
      registered[name] = handler;
    },
  };
}

describe('ToolManager API key guard', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENFDA_API_KEY;
    delete process.env.OPENFDA_ALLOW_KEYLESS;
    fetchStub = stubFetch([{ meta: { results: { total: 0 } }, results: [] }]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  const tool = (calls: string[]) => ({
    name: 'demo-tool',
    description: 'demo',
    inputSchema: z.object({}),
    handler: async () => {
      calls.push('handler ran');
      return { content: [{ type: 'text', text: 'ok' }] };
    },
  });

  it('returns an actionable error and never calls the handler when the key is missing', async () => {
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    const result = await server.registered['demo-tool']({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(MISSING_KEY_MESSAGE);
    expect(handlerCalls).toEqual([]);
  });

  it('makes zero network requests when the key is missing', async () => {
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool([]));

    await server.registered['demo-tool']({});

    expect(fetchStub.calls).toEqual([]);
  });

  it('never echoes the key in the guard message', async () => {
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool([]));

    const result = await server.registered['demo-tool']({});

    expect(result.content[0].text).not.toMatch(/api_key/i);
  });

  it('runs the handler when a key is present', async () => {
    process.env.OPENFDA_API_KEY = 'TEST_API_KEY';
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    const result = await server.registered['demo-tool']({});

    expect(handlerCalls).toEqual(['handler ran']);
    expect(result.isError).toBeUndefined();
  });

  it('runs the handler when keyless is explicitly opted into', async () => {
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    await server.registered['demo-tool']({});

    expect(handlerCalls).toEqual(['handler ran']);
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npx vitest run tests/ToolManager.keyguard.test.ts`
Expected: FAIL — the handler runs even with no key.

- [ ] **Step 8: Add the guard to `ToolManager`**

In `src/ToolManager.ts`, add the import and wrap the handler. Replace
`registerTool` (lines 25-34) with:

```ts
  registerTool = (definition: ToolDefinition) =>
    this.server.registerTool(
      definition.name,
      {
        title: definition.name,
        description: definition.description,
        inputSchema: definition.inputSchema,
      },
      (async (input: z.infer<any>) => {
        // Single chokepoint: every tool inherits the key check, so a missing
        // key can never reach the network or produce a misleading 403.
        const status = checkApiKey();
        if (!status.ok) {
          return {
            content: [{ type: 'text' as const, text: status.message }],
            isError: true,
          };
        }
        return definition.handler(input);
      }) as any
    );
```

Add at the top of the file, after the existing imports:

```ts
import { checkApiKey } from './utils/env.js';
```

- [ ] **Step 9: Run it and confirm it passes**

Run: `npx vitest run tests/ToolManager.keyguard.test.ts tests/ToolManager.test.ts`
Expected: PASS. If the pre-existing `tests/ToolManager.test.ts` now fails
because it registers a tool without setting `OPENFDA_API_KEY`, set
`process.env.OPENFDA_API_KEY = 'TEST_API_KEY'` in its `beforeEach` — the guard
is the new correct behavior, so the test adapts to it.

- [ ] **Step 10: Add the startup warning**

In `src/index.ts`, add to the imports:

```ts
import { warnIfKeyless } from './utils/env.js';
```

and call it inside `main()`, immediately before `server.connect`:

```ts
async function main() {
  warnIfKeyless();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenFDA MCP Server running on stdio');
}
```

- [ ] **Step 11: Verify the whole suite and types**

Run: `npm run test:ci && npm run typecheck`
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add src/utils/env.ts src/ToolManager.ts src/index.ts \
  tests/env.test.ts tests/ToolManager.keyguard.test.ts tests/helpers/stubFetch.ts
git commit -m "fix: fail fast with an actionable error when OPENFDA_API_KEY is unset

Previously an unset key produced 'Forbidden: API key may be invalid or
quota exceeded', because api_key=undefined was sent literally and openFDA
answered 403. The key was not invalid, it was absent.

The guard lives in ToolManager so all eight tools inherit it, returns the
fix instructions to the calling agent, and makes zero network requests.
OPENFDA_ALLOW_KEYLESS=1 opts in to the unauthenticated tier explicitly.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Correct URL construction and query encoding (P0-2, part 2)

**Files:**
- Modify: `src/OpenFDABuilder.ts:60-72`
- Modify: `src/drug/get-drug-adverse-events.ts:38`
- Modify: `tests/OpenFDABuilder.test.ts:58-69` (replace)

**Interfaces:**
- Consumes: `checkApiKey` from `src/utils/env.ts` (Task 2).
- Produces: `OpenFDABuilder.build()` returning a URL with percent-encoded
  parameters and `api_key` omitted entirely when running keyless.

**Critical context:** `URLSearchParams` encodes a literal `+` as `%2B`. The
adverse-events handler currently builds `+AND+` directly into the search
string, which would become `%2BAND%2B` and return `NOT_FOUND`. It must use a
space-separated `" AND "`; `URLSearchParams` then encodes the spaces back to
`+` on the wire, which is what openFDA expects. Measured: raw `+AND+` → 293489
results, encoded `+AND+` → NOT_FOUND, encoded `" AND "` → 293489.

- [ ] **Step 1: Replace the test that asserts the bug**

In `tests/OpenFDABuilder.test.ts`, delete the existing test
`'should include undefined in URL if API key is missing'` (lines 58-69) — it
asserts the defect. Add in its place:

```ts
  it('omits api_key entirely when running keyless', () => {
    delete process.env.OPENFDA_API_KEY;
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .limit(1)
      .build();
    expect(url).not.toContain('api_key');
    expect(url).toBe(
      'https://api.fda.gov/drug/label.json?search=some_query&limit=1'
    );
  });

  it('never emits the literal string api_key=undefined', () => {
    delete process.env.OPENFDA_API_KEY;
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .build();
    expect(url).not.toContain('undefined');
  });

  it('percent-encodes quotes and colons in the search query', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .build();
    expect(url).toContain('search=openfda.brand_name%3A%22Advil%22');
  });

  it('encodes a drug name containing an ampersand without corrupting the query', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Tylenol & Codeine"')
      .build();
    expect(url).toContain('%26');
    // the ampersand must not start a new query parameter
    expect(url.split('&').length).toBe(3); // api_key, search, limit
  });

  it('encodes a space-separated AND filter as +AND+ on the wire', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('patient.drug.medicinalproduct:"x" AND serious:1')
      .build();
    expect(url).toContain('+AND+');
    expect(url).not.toContain('%2BAND%2B');
  });
```

The three existing tests that assert the old raw-interpolation format
(`'should build a valid URL with all parameters'`, `'should use a default limit
of 1'`, `'should handle a limit of 0'`) must also be updated: the expected URL
is now `https://api.fda.gov/drug/label.json?api_key=TEST_API_KEY&search=openfda.brand_name%3A%22Advil%22&limit=5`.
The `toContain('&limit=1')` and `toContain('&limit=0')` assertions still hold.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/OpenFDABuilder.test.ts`
Expected: FAIL on the encoding and keyless assertions.

- [ ] **Step 3: Rewrite `build()`**

In `src/OpenFDABuilder.ts`, add the import:

```ts
import { checkApiKey } from './utils/env.js';
```

and replace `build()` (lines 60-72) with:

```ts
  build(): string {
    const dataset = this.params.get('dataset');
    const context = this.params.get('context');
    const search = this.params.get('search');
    const limit = this.params.get('limit') ?? 1;

    if (!dataset || !context || !search) {
      throw new Error('Missing required parameters: context or search');
    }

    const status = checkApiKey();
    const query = new URLSearchParams();
    // Omitted entirely when keyless: `api_key=undefined` is rejected with
    // HTTP 403 API_KEY_INVALID, while no parameter at all is accepted.
    if (status.ok && status.apiKey) query.set('api_key', status.apiKey);
    query.set('search', String(search));
    query.set('limit', String(limit));

    return `${this.urlBase}/${dataset}/${context}.json?${query}`;
  }
```

- [ ] **Step 4: Run and confirm the builder tests pass**

Run: `npx vitest run tests/OpenFDABuilder.test.ts`
Expected: PASS.

- [ ] **Step 5: Fix the adverse-events AND filter**

In `src/drug/get-drug-adverse-events.ts`, change line 38:

```ts
      searchQuery += `+AND+serious:${serious}`;
```

to:

```ts
      searchQuery += ` AND serious:${serious}`;
```

- [ ] **Step 6: Add a regression test for the filter**

Create `tests/adverse-events-query.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { stubFetch } from './helpers/stubFetch';

describe('get-drug-adverse-events query encoding', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      { meta: { results: { skip: 0, limit: 1, total: 42 } }, results: [] },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('sends the seriousness filter as +AND+ and never as %2BAND%2B', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'metformin',
      limit: 1,
      seriousness: 'serious',
    });

    expect(fetchStub.calls[0]).toContain('+AND+serious%3A1');
    expect(fetchStub.calls[0]).not.toContain('%2BAND%2B');
  });

  it('omits the filter entirely for seriousness=all', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'metformin',
      limit: 1,
      seriousness: 'all',
    });

    expect(fetchStub.calls[0]).not.toContain('serious%3A');
  });
});
```

- [ ] **Step 7: Run it and the full suite**

Run: `npx vitest run tests/adverse-events-query.test.ts && npm run test:ci && npm run typecheck`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/OpenFDABuilder.ts src/drug/get-drug-adverse-events.ts \
  tests/OpenFDABuilder.test.ts tests/adverse-events-query.test.ts
git commit -m "fix: encode query parameters and omit api_key when keyless

build() now uses URLSearchParams, so api_key is omitted rather than sent
as the literal string 'undefined', and user input containing & or # no
longer corrupts the query.

URLSearchParams encodes a literal + as %2B, which would have silently
broken the adverse-events seriousness filter, so that handler now builds
' AND ' and lets the encoder produce +AND+ on the wire.

Replaces the builder test that asserted the old api_key=undefined bug.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Map boxed_warning and PLR warnings (P1-1, P1-2, P3-1)

**Files:**
- Create: `scripts/capture-fixtures.mjs`
- Create: `tests/fixtures/label-jantoven.json`, `label-lipitor.json`, `label-zoloft.json`
- Create: `src/drug/label-fields.ts`
- Create: `tests/label-fields.test.ts`
- Modify: `src/types.ts:25-55`
- Modify: `src/drug/get-drug-safety-info.ts:52-65`
- Modify: `src/drug/get-drug-by-name.ts` (the `drugInfo` object)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `mapSafetyFields(drug: Record<string, unknown>): SafetyFields` and
  `mapLabelFields(drug: Record<string, unknown>): LabelFields` from
  `src/drug/label-fields.ts`. Every key on both return types is always present,
  defaulting to `[]`.

**Critical context:** the PLR field is `warnings_and_cautions`. It is **not**
`warnings_and_precautions` — that name does not exist in the openFDA schema and
would map to a permanently empty array.

- [ ] **Step 1: Write the fixture capture script**

Create `scripts/capture-fixtures.mjs`. This is run manually, not by the suite:

```js
// Manual fixture capture. Run: node scripts/capture-fixtures.mjs
// Hits the live openFDA API and writes trimmed responses to tests/fixtures/.
import { writeFileSync, mkdirSync } from 'node:fs';

const KEEP = [
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
  'ask_doctor_or_pharmacist',
  'stop_use',
  'pregnancy_or_breast_feeding',
  'indications_and_usage',
  'active_ingredient',
  'purpose',
  'dosage_and_administration',
  'spl_product_data_elements',
];

const TARGETS = [
  ['label-jantoven', 'openfda.brand_name:"Jantoven"'],
  ['label-lipitor', 'openfda.brand_name:"Lipitor"'],
  ['label-zoloft', 'openfda.brand_name:"Zoloft"'],
  ['label-citalopram', 'openfda.generic_name:"citalopram"'],
];

// Truncate long narrative strings; tests care about presence, not prose.
const trim = (value) =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.slice(0, 200) : v))
    : value;

mkdirSync('tests/fixtures', { recursive: true });

for (const [name, search] of TARGETS) {
  const url =
    'https://api.fda.gov/drug/label.json?' +
    new URLSearchParams({ search, limit: '1' });
  const body = await (await fetch(url)).json();
  const source = body.results[0];

  const result = { openfda: source.openfda };
  for (const field of KEEP) {
    if (field in source) result[field] = trim(source[field]);
  }

  writeFileSync(
    `tests/fixtures/${name}.json`,
    JSON.stringify({ meta: body.meta, results: [result] }, null, 2) + '\n'
  );
  console.log(`wrote tests/fixtures/${name}.json`);
}
```

- [ ] **Step 2: Run the capture script once and inspect the output**

Run: `node scripts/capture-fixtures.mjs`
Expected: four files written. Verify the key property the tests depend on:

```bash
node -e 'const j=require("./tests/fixtures/label-jantoven.json");console.log("jantoven boxed:", Array.isArray(j.results[0].boxed_warning));'
node -e 'const j=require("./tests/fixtures/label-lipitor.json");console.log("lipitor boxed present:", "boxed_warning" in j.results[0]);'
```

Expected: `jantoven boxed: true` and `lipitor boxed present: false`. Lipitor
genuinely has no boxed warning upstream — that is the control case.

- [ ] **Step 3: Write the failing mapper test**

Create `tests/label-fields.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapSafetyFields, mapLabelFields } from '../src/drug/label-fields';
import jantoven from './fixtures/label-jantoven.json';
import lipitor from './fixtures/label-lipitor.json';
import zoloft from './fixtures/label-zoloft.json';

describe('mapSafetyFields', () => {
  it('returns a populated boxed_warning for a drug that has one', () => {
    const mapped = mapSafetyFields(jantoven.results[0] as any);
    expect(mapped.boxed_warning.length).toBeGreaterThan(0);
  });

  it('returns an empty array, not a missing key, for a drug with no boxed warning', () => {
    const mapped = mapSafetyFields(lipitor.results[0] as any);
    expect(mapped).toHaveProperty('boxed_warning');
    expect(mapped.boxed_warning).toEqual([]);
  });

  it('populates warnings from the PLR warnings_and_cautions field', () => {
    const mapped = mapSafetyFields(zoloft.results[0] as any);
    expect(mapped.warnings.length).toBeGreaterThan(0);
    expect(mapped.warnings_and_cautions.length).toBeGreaterThan(0);
  });

  it('prefers the old-format warnings field when both are present', () => {
    const mapped = mapSafetyFields({
      warnings: ['old format'],
      warnings_and_cautions: ['plr format'],
    });
    expect(mapped.warnings).toEqual(['old format']);
    expect(mapped.warnings_and_cautions).toEqual(['plr format']);
  });

  it('defaults every key to an empty array for an empty label', () => {
    const mapped = mapSafetyFields({});
    for (const [key, value] of Object.entries(mapped)) {
      expect(value, `${key} should default to []`).toEqual([]);
    }
  });
});

describe('mapLabelFields', () => {
  it('always includes the five fields the tool description promises', () => {
    const mapped = mapLabelFields({});
    expect(mapped).toHaveProperty('warnings', []);
    expect(mapped).toHaveProperty('do_not_use', []);
    expect(mapped).toHaveProperty('ask_doctor', []);
    expect(mapped).toHaveProperty('stop_use', []);
    expect(mapped).toHaveProperty('pregnancy_or_breast_feeding', []);
  });

  it('includes boxed_warning so a consumer can see it is absent', () => {
    expect(mapLabelFields({})).toHaveProperty('boxed_warning', []);
  });
});
```

- [ ] **Step 4: Run and confirm failure**

Run: `npx vitest run tests/label-fields.test.ts`
Expected: FAIL — cannot resolve `../src/drug/label-fields`.

`tsconfig.json` already sets `"resolveJsonModule": true`, so the fixture
imports resolve without further configuration.

- [ ] **Step 5: Implement the mapper**

Create `src/drug/label-fields.ts`:

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

type RawLabel = Record<string, unknown>;

/** Coerce an openFDA label field to a string array; absent becomes []. */
const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? (value as string[]) : [];

/**
 * Modern prescription labels follow the Physician Labeling Rule and store
 * this content in `warnings_and_cautions`; older OTC-style labels use
 * `warnings`. Consult both so PLR labels are not reported as empty.
 */
const resolveWarnings = (drug: RawLabel): string[] => {
  const legacy = asArray(drug.warnings);
  return legacy.length > 0 ? legacy : asArray(drug.warnings_and_cautions);
};

export interface SafetyFields {
  boxed_warning: string[];
  warnings: string[];
  warnings_and_cautions: string[];
  contraindications: string[];
  drug_interactions: string[];
  precautions: string[];
  adverse_reactions: string[];
  overdosage: string[];
  do_not_use: string[];
  ask_doctor: string[];
  stop_use: string[];
  pregnancy_or_breast_feeding: string[];
}

/**
 * Every key is always present. A consumer must be able to distinguish
 * "this drug has no boxed warning" (empty array) from "this server never
 * mapped the field" (missing key).
 */
export function mapSafetyFields(drug: RawLabel): SafetyFields {
  return {
    boxed_warning: asArray(drug.boxed_warning),
    warnings: resolveWarnings(drug),
    warnings_and_cautions: asArray(drug.warnings_and_cautions),
    contraindications: asArray(drug.contraindications),
    drug_interactions: asArray(drug.drug_interactions),
    precautions: asArray(drug.precautions),
    adverse_reactions: asArray(drug.adverse_reactions),
    overdosage: asArray(drug.overdosage),
    do_not_use: asArray(drug.do_not_use),
    ask_doctor: asArray(drug.ask_doctor),
    stop_use: asArray(drug.stop_use),
    pregnancy_or_breast_feeding: asArray(drug.pregnancy_or_breast_feeding),
  };
}

export interface LabelFields {
  indications_and_usage: string[];
  boxed_warning: string[];
  warnings: string[];
  warnings_and_cautions: string[];
  do_not_use: string[];
  ask_doctor: string[];
  ask_doctor_or_pharmacist: string[];
  stop_use: string[];
  pregnancy_or_breast_feeding: string[];
}

/** The narrative fields `get-drug-by-name`'s description promises. */
export function mapLabelFields(drug: RawLabel): LabelFields {
  return {
    indications_and_usage: asArray(drug.indications_and_usage),
    boxed_warning: asArray(drug.boxed_warning),
    warnings: resolveWarnings(drug),
    warnings_and_cautions: asArray(drug.warnings_and_cautions),
    do_not_use: asArray(drug.do_not_use),
    ask_doctor: asArray(drug.ask_doctor),
    ask_doctor_or_pharmacist: asArray(drug.ask_doctor_or_pharmacist),
    stop_use: asArray(drug.stop_use),
    pregnancy_or_breast_feeding: asArray(drug.pregnancy_or_breast_feeding),
  };
}
```

- [ ] **Step 6: Run and confirm the mapper tests pass**

Run: `npx vitest run tests/label-fields.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 7: Add the new fields to `src/types.ts`**

In the `Result` interface, add after `warnings: string[];`:

```ts
  boxed_warning?: string[];
  warnings_and_cautions?: string[];
```

Both are optional: many labels genuinely lack them.

- [ ] **Step 8: Wire the mapper into `get-drug-safety-info`**

Add the import:

```ts
import { mapSafetyFields } from './label-fields.js';
```

Replace the `safetyInfo` object (lines 52-65) with:

```ts
    const safetyInfo = {
      drug_name: drug?.openfda.brand_name?.[0] || drugName,
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      ...mapSafetyFields(drug as unknown as Record<string, unknown>),
    };
```

- [ ] **Step 9: Wire the mapper into `get-drug-by-name`**

Replace the `drugInfo` object with:

```ts
    const drugInfo = {
      brand_name: drug?.openfda.brand_name,
      generic_name: drug?.openfda.generic_name,
      manufacturer_name: drug?.openfda.manufacturer_name,
      product_ndc: drug?.openfda.product_ndc,
      product_type: drug?.openfda.product_type,
      route: drug?.openfda.route,
      substance_name: drug?.openfda.substance_name,
      ...mapLabelFields(drug as unknown as Record<string, unknown>),
    };
```

and add the import:

```ts
import { mapLabelFields } from './label-fields.js';
```

- [ ] **Step 10: Verify end to end**

Run: `npm run test:ci && npm run typecheck && npm run build`
Expected: all pass.

- [ ] **Step 11: Commit**

```bash
git add scripts/capture-fixtures.mjs tests/fixtures src/drug/label-fields.ts \
  tests/label-fields.test.ts src/types.ts src/drug/get-drug-safety-info.ts \
  src/drug/get-drug-by-name.ts
git commit -m "fix: return boxed_warning and PLR warnings_and_cautions

get-drug-safety-info never mapped boxed_warning, so it was absent for all
drugs — including those carrying one. It also read only the legacy
warnings field, leaving warnings empty on modern PLR labels.

Every mapped key is now always present, defaulting to [], so a consumer
can tell 'this drug has no boxed warning' from 'this field is never
mapped'. Also fixes get-drug-by-name omitting five fields its own
description promises.

Note: the PLR field is warnings_and_cautions, not warnings_and_precautions.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Accept the NDC formats this server emits (P2-1)

**Files:**
- Modify: `src/utils/ndc.ts:29-42`
- Modify: `src/drug/get-drug-by-product-ndc.ts:13-28`
- Create: `tests/ndc.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `normalizeNDC(ndc: string): { productNDC: string; packageNDC: string | null; isValid: boolean }`
  — same signature as today, wider acceptance.

**Critical context:** product NDCs are legitimately 5-3 as well as 5-4.
`get-drug-by-name("Lipitor")` returns `58151-155`, which
`get-drug-by-product-ndc` currently rejects. Verified: `58151-155` returns 1
result upstream. Zero-padding to `58151-0155` is **not** a fix — that is a
different NDC.

**Deviation from spec §4:** the spec lists 10-digit undashed input as accepted.
It should not be. A 10-digit NDC is genuinely ambiguous (4-4-2, 5-3-2 and 5-4-1
all have ten digits) and cannot be segmented without knowing the labeler code
length. This plan accepts 8, 9 and 11 digits and rejects 10 with an explanation
rather than guessing.

- [ ] **Step 1: Write the failing test**

Create `tests/ndc.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeNDC } from '../src/utils/ndc';

describe('normalizeNDC', () => {
  it('accepts a 5-4 product NDC', () => {
    expect(normalizeNDC('12345-1234')).toEqual({
      productNDC: '12345-1234',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts a 5-3 product NDC, which this server emits for Lipitor', () => {
    expect(normalizeNDC('58151-155')).toEqual({
      productNDC: '58151-155',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts a 5-4-2 package NDC and derives the product NDC', () => {
    expect(normalizeNDC('12345-1234-01')).toEqual({
      productNDC: '12345-1234',
      packageNDC: '12345-1234-01',
      isValid: true,
    });
  });

  it('accepts a 5-3-2 package NDC', () => {
    expect(normalizeNDC('58151-155-01')).toEqual({
      productNDC: '58151-155',
      packageNDC: '58151-155-01',
      isValid: true,
    });
  });

  it('accepts a 9-digit undashed NDC as 5-4', () => {
    expect(normalizeNDC('123451234')).toEqual({
      productNDC: '12345-1234',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts an 8-digit undashed NDC as 5-3', () => {
    expect(normalizeNDC('58151155')).toEqual({
      productNDC: '58151-155',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts an 11-digit undashed NDC as 5-4-2', () => {
    expect(normalizeNDC('12345123401')).toEqual({
      productNDC: '12345-1234',
      packageNDC: '12345-1234-01',
      isValid: true,
    });
  });

  it('rejects a 10-digit undashed NDC as ambiguous', () => {
    expect(normalizeNDC('1234512340').isValid).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(normalizeNDC('not-an-ndc').isValid).toBe(false);
    expect(normalizeNDC('12345').isValid).toBe(false);
    expect(normalizeNDC('12345-1234-01-99').isValid).toBe(false);
    expect(normalizeNDC('').isValid).toBe(false);
  });

  it('tolerates surrounding whitespace', () => {
    expect(normalizeNDC('  58151-155  ').isValid).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/ndc.test.ts`
Expected: FAIL on the 5-3, 5-3-2, 8-digit and 10-digit cases.

- [ ] **Step 3: Rewrite `src/utils/ndc.ts`**

Replace the whole file body after the header comment with:

```ts
// A product NDC is 5-4 or 5-3; a package NDC appends a 1-2 digit suffix.
const PRODUCT_NDC = /^\d{5}-\d{3,4}$/;
const PACKAGE_SUFFIX = /^\d{1,2}$/;

export function normalizeNDC(ndc: string): {
  productNDC: string;
  packageNDC: string | null;
  isValid: boolean;
} {
  const cleanNDC = ndc.trim().toUpperCase();
  const invalid = { productNDC: cleanNDC, packageNDC: null, isValid: false };

  let productNDC: string;
  let packageNDC: string | null = null;

  if (cleanNDC.includes('-')) {
    const parts = cleanNDC.split('-');

    if (parts.length === 2) {
      productNDC = cleanNDC;
    } else if (parts.length === 3) {
      if (!PACKAGE_SUFFIX.test(parts[2]!)) return invalid;
      productNDC = `${parts[0]}-${parts[1]}`;
      packageNDC = cleanNDC;
    } else {
      return invalid;
    }
  } else if (/^\d+$/.test(cleanNDC)) {
    // Undashed forms. 10 digits is deliberately unsupported: 4-4-2, 5-3-2
    // and 5-4-1 are all ten digits, so segmenting it would be a guess.
    if (cleanNDC.length === 11) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
      packageNDC = `${productNDC}-${cleanNDC.slice(9, 11)}`;
    } else if (cleanNDC.length === 9) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`;
    } else if (cleanNDC.length === 8) {
      productNDC = `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}`;
    } else {
      return invalid;
    }
  } else {
    return invalid;
  }

  if (!PRODUCT_NDC.test(productNDC)) return invalid;

  return { productNDC, packageNDC, isValid: true };
}
```

- [ ] **Step 4: Run and confirm the NDC tests pass**

Run: `npx vitest run tests/ndc.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Replace the duplicate check in `get-drug-by-product-ndc`**

This is the self-inconsistency: a second, stricter check that disagrees with
the shared helper. Add the import:

```ts
import { normalizeNDC } from '../utils/ndc.js';
```

Replace the validation block (lines 18-28) with:

```ts
    const { productNDC: normalizedNDC, isValid } = normalizeNDC(productNDC);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid product NDC format: "${productNDC}"\n\n✅ Accepted formats:\n• 5-4 product NDC: 12345-1234\n• 5-3 product NDC: 58151-155\n• Undashed: 123451234 or 58151155\n\nNote: a 10-digit undashed NDC is ambiguous and is not accepted; include the dashes.`,
          },
        ],
        isError: true,
      };
    }
```

Then replace every subsequent `productNDC.trim()` in the handler with
`normalizedNDC` — the `.search(...)` call on line 33 and the
`ndc.startsWith(...)` filter on line 68.

- [ ] **Step 6: Update the tool description and schema text**

Change the `description` and the `describe()` so they match what is accepted:

```ts
  description:
    'Get drug information by product NDC (5-4 such as 12345-1234, or 5-3 such as 58151-155). This ignores package variations and finds all packages for a product.',
  inputSchema: z.object({
    productNDC: z
      .string()
      .describe('Product NDC, 5-4 (12345-1234) or 5-3 (58151-155)'),
  }),
```

- [ ] **Step 7: Verify the tool accepts the NDC it used to reject**

Create `tests/product-ndc-tool.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc';
import { stubFetch } from './helpers/stubFetch';

describe('get-drug-by-product-ndc', () => {
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
              brand_name: ['LIPITOR'],
              package_ndc: ['58151-155-01'],
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

  it('reaches the API for a 5-3 product NDC instead of rejecting it', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: '58151-155' });

    expect(fetchStub.calls.length).toBe(1);
    expect(result.isError).toBeUndefined();
  });

  it('rejects genuine garbage without making a request', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: 'nope' });

    expect(result.isError).toBe(true);
    expect(fetchStub.calls.length).toBe(0);
  });
});
```

- [ ] **Step 8: Run the suite**

Run: `npm run test:ci && npm run typecheck`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/utils/ndc.ts src/drug/get-drug-by-product-ndc.ts \
  tests/ndc.test.ts tests/product-ndc-tool.test.ts
git commit -m "fix: accept 5-3 product NDCs that this server itself emits

get-drug-by-name('Lipitor') returns 58151-155, which
get-drug-by-product-ndc rejected without making a request. Product NDCs
are legitimately 5-3 as well as 5-4.

Removes the duplicate, stricter regex in the handler so both NDC tools
share one helper and cannot disagree again. A 10-digit undashed NDC stays
rejected: 4-4-2, 5-3-2 and 5-4-1 are all ten digits, so segmenting it
would be guesswork.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Report result totals (P2-2)

**Files:**
- Create: `src/utils/format.ts`
- Create: `tests/format.test.ts`
- Modify: `src/drug/get-drug-by-generic-name.ts:74`
- Modify: `src/drug/get-drugs-by-manufacturer.ts:74`
- Modify: `src/drug/get-drug-adverse-events.ts:99`
- Modify: `src/drug/get-drug-by-ndc.ts:117`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `summarizeResults(returned: number, total: number | undefined, noun: string): string`
  and `withTotals<T>(returned: T[], total: number | undefined, limit: number): { total: number | null; returned: number; limit: number; results: T[] }`
  from `src/utils/format.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { summarizeResults, withTotals } from '../src/utils/format';

describe('summarizeResults', () => {
  it('reports the total alongside the returned count', () => {
    expect(summarizeResults(3, 91, 'matching labels')).toBe(
      'Showing 3 of 91 matching labels'
    );
  });

  it('does not imply a total it does not have', () => {
    expect(summarizeResults(3, undefined, 'matching labels')).toBe(
      'Showing 3 matching labels (total unknown)'
    );
  });

  it('states plainly when everything is shown', () => {
    expect(summarizeResults(2, 2, 'matching labels')).toBe(
      'Showing all 2 matching labels'
    );
  });
});

describe('withTotals', () => {
  it('carries the total in the structured payload, not only the prose', () => {
    expect(withTotals(['a', 'b'], 91, 10)).toEqual({
      total: 91,
      returned: 2,
      limit: 10,
      results: ['a', 'b'],
    });
  });

  it('uses null rather than inventing a total when it is unknown', () => {
    expect(withTotals(['a'], undefined, 10).total).toBeNull();
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/format.test.ts`
Expected: FAIL — cannot resolve `../src/utils/format`.

- [ ] **Step 3: Implement `src/utils/format.ts`**

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Describe a truncated result set without implying the returned count is the
 * total. "Found 3" reads as a total to every consumer, human or model, and
 * makes "past the limit" indistinguishable from "not present".
 */
export function summarizeResults(
  returned: number,
  total: number | undefined,
  noun: string
): string {
  if (typeof total !== 'number') {
    return `Showing ${returned} ${noun} (total unknown)`;
  }
  if (returned >= total) {
    return `Showing all ${total} ${noun}`;
  }
  return `Showing ${returned} of ${total} ${noun}`;
}

/** Wrap results so the total is machine-readable, not only in the header. */
export function withTotals<T>(
  results: T[],
  total: number | undefined,
  limit: number
): { total: number | null; returned: number; limit: number; results: T[] } {
  return {
    total: typeof total === 'number' ? total : null,
    returned: results.length,
    limit,
    results,
  };
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx vitest run tests/format.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Apply to `get-drug-by-generic-name`**

Add the import:

```ts
import { summarizeResults, withTotals } from '../utils/format.js';
```

Replace the success return's `text` (line 74) with:

```ts
          text: `${summarizeResults(drugs.length, drugData.meta?.results?.total, `labels with generic name "${genericName}"`)}\n\n${JSON.stringify(withTotals(drugs, drugData.meta?.results?.total, limit ?? 5), null, 2)}`,
```

`limit` is declared `limit?: number`, so it needs the schema default (`5`)
applied explicitly — `strict` mode rejects passing `number | undefined`.

- [ ] **Step 6: Apply to `get-drugs-by-manufacturer`**

Same import. Replace line 74's `text` with:

```ts
          text: `${summarizeResults(drugs.length, drugData.meta?.results?.total, `labels from manufacturer "${manufacturerName}"`)}\n\n${JSON.stringify(withTotals(drugs, drugData.meta?.results?.total, limit ?? 20), null, 2)}`,
```

- [ ] **Step 7: Apply to `get-drug-adverse-events`**

Same import. Replace line 99's `text` with:

```ts
          text: `${summarizeResults(events.length, eventData.meta?.results?.total, `adverse event reports for "${drugName}"`)}\n\n${JSON.stringify(withTotals(events, eventData.meta?.results?.total, limit ?? 10), null, 2)}`,
```

- [ ] **Step 8: Apply to `get-drug-by-ndc`**

Same import. Replace line 117's `text` with:

```ts
          text: `${summarizeResults(results.length, drugData.meta?.results?.total, `labels for NDC "${ndcCode}"`)} with ${totalPackages} package(s)\n\n${searchSummary}\n\n${JSON.stringify(withTotals(results, drugData.meta?.results?.total, 10), null, 2)}`,
```

- [ ] **Step 9: Add an integration test proving the total differs from the limit**

Append to `tests/format.test.ts`:

```ts
import { getDrugByGenericName } from '../src/drug/get-drug-by-generic-name';
import { stubFetch } from './helpers/stubFetch';
import { beforeEach, afterEach } from 'vitest';

describe('list tools report the upstream total', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 3, total: 91 } },
        results: [
          { openfda: { brand_name: ['A'] } },
          { openfda: { brand_name: ['B'] } },
          { openfda: { brand_name: ['C'] } },
        ],
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('distinguishes the requested limit from the matching total', async () => {
    const result = await getDrugByGenericName.handler({
      genericName: 'citalopram',
      limit: 3,
    });

    const text = result.content[0].text;
    expect(text).toContain('Showing 3 of 91');
    expect(text).not.toContain('Found 3 drug(s)');
    expect(JSON.parse(text.slice(text.indexOf('{'))).total).toBe(91);
  });
});
```

The handler's signature is `{ genericName: string; limit?: number }`, so this
call matches it.

- [ ] **Step 10: Run the suite**

Run: `npm run test:ci && npm run typecheck`
Expected: all pass.

- [ ] **Step 11: Commit**

```bash
git add src/utils/format.ts tests/format.test.ts src/drug/get-drug-by-generic-name.ts \
  src/drug/get-drugs-by-manufacturer.ts src/drug/get-drug-adverse-events.ts \
  src/drug/get-drug-by-ndc.ts
git commit -m "feat: report the upstream result total, not the caller's limit

Every list tool said 'Found N' where N was the requested limit, so
past-the-limit and not-present were indistinguishable. A limit:3 query for
citalopram now reports 'Showing 3 of 91' and carries the total in the
structured payload as well as the header.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Resolve originator brand names (P2-3)

**Files:**
- Create: `src/drug/resolve-label.ts`
- Create: `tests/resolve-label.test.ts`
- Modify: `src/drug/get-drug-safety-info.ts:17-50`

**Interfaces:**
- Consumes: `OpenFDABuilder`, `makeOpenFDARequest`, and `summarizeResults` is
  not needed here.
- Produces:
  - `type MatchedVia = 'openfda.brand_name' | 'openfda.generic_name' | 'openfda.substance_name' | 'spl_product_data_elements'`
  - `RESOLUTION_TIERS: readonly MatchedVia[]`
  - `resolveLabel(term: string, limit?: number): Promise<ResolveResult>` where
    `ResolveResult = { found: true; matched_via: MatchedVia; data: OpenFDAResponse } | { found: false; error?: OpenFDAError }`

**Critical context:** `Cordarone` and `Glucophage` return NOT_FOUND on
`openfda.brand_name` but both resolve via `spl_product_data_elements`
(Cordarone 1 result, Glucophage 4). Tiers are queried sequentially, stopping at
the first hit, so the common case stays a single request.

- [ ] **Step 1: Write the failing test**

Create `tests/resolve-label.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveLabel, RESOLUTION_TIERS } from '../src/drug/resolve-label';
import { stubFetch } from './helpers/stubFetch';

const empty = { meta: { results: { skip: 0, limit: 1, total: 0 } }, results: [] };
const hit = (brand: string) => ({
  meta: { results: { skip: 0, limit: 1, total: 1 } },
  results: [{ openfda: { brand_name: [brand] } }],
});

describe('resolveLabel', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('tries the tiers in the documented order', () => {
    expect(RESOLUTION_TIERS).toEqual([
      'openfda.brand_name',
      'openfda.generic_name',
      'openfda.substance_name',
      'spl_product_data_elements',
    ]);
  });

  it('stops at the first tier and makes exactly one request on a brand hit', async () => {
    fetchStub = stubFetch([hit('ZESTRIL')]);

    const result = await resolveLabel('Zestril');

    expect(result.found).toBe(true);
    expect(result).toHaveProperty('matched_via', 'openfda.brand_name');
    expect(fetchStub.calls.length).toBe(1);
  });

  it('falls through to spl_product_data_elements for Cordarone', async () => {
    fetchStub = stubFetch([empty, empty, empty, hit('AMIODARONE HCL')]);

    const result = await resolveLabel('Cordarone');

    expect(result.found).toBe(true);
    expect(result).toHaveProperty('matched_via', 'spl_product_data_elements');
    expect(fetchStub.calls.length).toBe(4);
  });

  it('reports not found once every tier misses', async () => {
    fetchStub = stubFetch([empty, empty, empty, empty]);

    const result = await resolveLabel('Notadrugatall');

    expect(result.found).toBe(false);
  });

  it('queries each tier against its own field', async () => {
    fetchStub = stubFetch([empty, hit('X')]);

    await resolveLabel('metformin');

    expect(fetchStub.calls[0]).toContain('openfda.brand_name');
    expect(fetchStub.calls[1]).toContain('openfda.generic_name');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/resolve-label.test.ts`
Expected: FAIL — cannot resolve `../src/drug/resolve-label`.

- [ ] **Step 3: Implement `src/drug/resolve-label.ts`**

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import type { OpenFDAResponse, OpenFDAError } from '../types.js';

export type MatchedVia =
  | 'openfda.brand_name'
  | 'openfda.generic_name'
  | 'openfda.substance_name'
  | 'spl_product_data_elements';

/**
 * Searched in order, stopping at the first tier with results.
 *
 * Exact brand search alone misses real originator brands: Cordarone and
 * Glucophage are absent from openfda.brand_name but present in the label's
 * own spl_product_data_elements. Tiers stay separate sequential queries
 * rather than one OR-ed query so relevance ordering stays predictable.
 */
export const RESOLUTION_TIERS: readonly MatchedVia[] = [
  'openfda.brand_name',
  'openfda.generic_name',
  'openfda.substance_name',
  'spl_product_data_elements',
];

export type ResolveResult =
  | { found: true; matched_via: MatchedVia; data: OpenFDAResponse }
  | { found: false; error?: OpenFDAError };

export async function resolveLabel(
  term: string,
  limit = 1
): Promise<ResolveResult> {
  let lastError: OpenFDAError | undefined;

  for (const field of RESOLUTION_TIERS) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`${field}:"${term}"`)
      .limit(limit)
      .build();

    const { data, error } = await makeOpenFDARequest<OpenFDAResponse>(url);

    // A miss on one tier is expected, not fatal: keep walking the tiers.
    if (error) {
      lastError = error;
      continue;
    }
    if (data?.results && data.results.length > 0) {
      return { found: true, matched_via: field, data };
    }
  }

  return { found: false, error: lastError };
}

/** Wording for the not-found path; the README promises suggestions. */
export const notFoundMessage = (term: string): string =>
  `No label found for "${term}".\n\nSearched, in order: ${RESOLUTION_TIERS.join(', ')}.\n\nSuggestions:\n- Check the spelling.\n- Try the generic name instead of the brand (e.g. "amiodarone" rather than "Cordarone").\n- Try the originator brand rather than a repackager's name.\n- Some discontinued brands have no current FDA label.`;
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx vitest run tests/resolve-label.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Wire it into `get-drug-safety-info`**

Replace the URL build and request (lines 17-50) so the handler uses the
resolver. The handler body becomes:

```ts
  async handler({ drugName }: { drugName: string }) {
    const resolved = await resolveLabel(drugName, 1);

    if (!resolved.found) {
      if (resolved.error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to retrieve safety information for "${drugName}": ${resolved.error.message}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: notFoundMessage(drugName) }],
      };
    }

    const drug = resolved.data.results[0];
    const safetyInfo = {
      drug_name: drug?.openfda.brand_name?.[0] || drugName,
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      matched_via: resolved.matched_via,
      ...mapSafetyFields(drug as unknown as Record<string, unknown>),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Safety information for "${drugName}":\n\n${JSON.stringify(safetyInfo, null, 2)}`,
        },
      ],
    };
  },
```

Update the imports at the top of the file — `OpenFDABuilder` and
`makeOpenFDARequest` are no longer used directly:

```ts
import { mapSafetyFields } from './label-fields.js';
import { resolveLabel, notFoundMessage } from './resolve-label.js';
```

- [ ] **Step 6: Update the tool description**

```ts
  description:
    'Get comprehensive safety information for a drug including the boxed warning, warnings and cautions, contraindications, drug interactions, and precautions. Accepts a brand name, generic name, or active substance; the response reports which field matched via matched_via.',
```

- [ ] **Step 7: Run the suite and build**

Run: `npm run test:ci && npm run typecheck && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/drug/resolve-label.ts tests/resolve-label.test.ts \
  src/drug/get-drug-safety-info.ts
git commit -m "fix: resolve brands that exact brand_name search misses

get-drug-safety-info searched only openfda.brand_name, so real originator
brands returned Not Found: Cordarone and Glucophage are both absent from
that field but present in spl_product_data_elements.

Resolution now walks brand_name, generic_name, substance_name and
spl_product_data_elements in order, stopping at the first hit so the
common case is still one request, and reports matched_via so the caller
knows the match was indirect. Not-found now returns real suggestions,
which the README already claimed.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Decode FAERS outcomes and deduplicate reactions (P3-4, P3-5)

**Files:**
- Create: `src/drug/faers.ts`
- Create: `tests/faers.test.ts`
- Modify: `src/drug/get-drug-adverse-events.ts:85-96`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `REACTION_OUTCOMES: Record<string, string>` and
  `describeOutcome(code: unknown): string` from `src/drug/faers.ts`.

**Critical context:** `patient.reaction[].reactionoutcome` is the field, and it
returns bare numeric strings. The FAERS enumeration is 1 Recovered/resolved,
2 Recovering/resolving, 3 Not recovered/not resolved, 4 Recovered with sequelae,
5 Fatal, 6 Unknown.

- [ ] **Step 1: Write the failing test**

Create `tests/faers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { describeOutcome, REACTION_OUTCOMES } from '../src/drug/faers';

describe('describeOutcome', () => {
  it('maps every documented FAERS outcome code', () => {
    expect(describeOutcome('1')).toBe('Recovered/resolved');
    expect(describeOutcome('2')).toBe('Recovering/resolving');
    expect(describeOutcome('3')).toBe('Not recovered/not resolved');
    expect(describeOutcome('4')).toBe('Recovered/resolved with sequelae');
    expect(describeOutcome('5')).toBe('Fatal');
    expect(describeOutcome('6')).toBe('Unknown');
  });

  it('covers exactly codes 1 through 6', () => {
    expect(Object.keys(REACTION_OUTCOMES).sort()).toEqual([
      '1', '2', '3', '4', '5', '6',
    ]);
  });

  it('does not silently invent a label for an unrecognized code', () => {
    expect(describeOutcome('9')).toBe('Unrecognized outcome code "9"');
    expect(describeOutcome(undefined)).toBe('Not reported');
  });

  it('accepts a numeric code as well as a string', () => {
    expect(describeOutcome(5)).toBe('Fatal');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run tests/faers.test.ts`
Expected: FAIL — cannot resolve `../src/drug/faers`.

- [ ] **Step 3: Implement `src/drug/faers.ts`**

```ts
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * FAERS `patient.reaction[].reactionoutcome` enumeration.
 *
 * The API returns bare numeric codes. Returning them unlabelled leaves the
 * consumer to guess, which is worse than useless for a safety dataset.
 */
export const REACTION_OUTCOMES: Record<string, string> = {
  '1': 'Recovered/resolved',
  '2': 'Recovering/resolving',
  '3': 'Not recovered/not resolved',
  '4': 'Recovered/resolved with sequelae',
  '5': 'Fatal',
  '6': 'Unknown',
};

export function describeOutcome(code: unknown): string {
  if (code === undefined || code === null || code === '') return 'Not reported';
  const key = String(code);
  return REACTION_OUTCOMES[key] ?? `Unrecognized outcome code "${key}"`;
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx vitest run tests/faers.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Use it, and deduplicate reactions, in the events handler**

In `src/drug/get-drug-adverse-events.ts` add the import:

```ts
import { describeOutcome } from './faers.js';
```

Replace the `reactions` and `outcomes` mapping (lines 85-96) with:

```ts
      // Raw FAERS records repeat the same reaction term within one report,
      // which reads as two distinct events. Deduplicate before truncating so
      // the 3-item slice carries three distinct terms.
      reactions: [
        ...new Set(
          (event.patient?.reaction ?? [])
            .map((r: any) => r.reactionmeddrapt)
            .filter(Boolean)
        ),
      ].slice(0, 3),
      outcomes: [
        ...new Set(
          (event.patient?.reaction ?? []).map((r: any) =>
            describeOutcome(r.reactionoutcome)
          )
        ),
      ].slice(0, 3),
```

- [ ] **Step 6: Add a test for the handler's mapping**

Append to `tests/faers.test.ts`:

```ts
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { stubFetch } from './helpers/stubFetch';
import { beforeEach, afterEach } from 'vitest';

describe('get-drug-adverse-events reaction mapping', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            safetyreportid: '123',
            serious: '1',
            patient: {
              reaction: [
                { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
                { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
                { reactionmeddrapt: 'Gait disturbance', reactionoutcome: '5' },
              ],
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

  it('deduplicates repeated reaction terms and decodes outcome codes', async () => {
    const result = await getDrugAdverseEvents.handler({
      drugName: 'x',
      limit: 1,
      seriousness: 'all',
    });
    const text = result.content[0].text;

    expect(text).toContain('Tremor');
    expect(text).not.toContain('"Tremor",\n          "Tremor"');
    expect(text).toContain('Recovered/resolved');
    expect(text).toContain('Fatal');
    expect(text).not.toMatch(/"outcomes":\s*\[\s*"1"/);
  });
});
```

- [ ] **Step 7: Run the suite**

Run: `npm run test:ci && npm run typecheck`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/drug/faers.ts tests/faers.test.ts src/drug/get-drug-adverse-events.ts
git commit -m "feat: decode FAERS outcome codes and deduplicate reactions

outcomes returned bare numeric codes with no legend, so consumers
correctly refused to interpret them. Reaction arrays also repeated terms
within a single record ('Tremor; Tremor'), which reads as two events.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Documentation and version bump (P3-6, P3-7)

**Files:**
- Modify: `README.md:20-62`
- Modify: `README.md` Features list
- Modify: `package.json` version
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the behavior established by Tasks 1-8.
- Produces: no code interface.

- [ ] **Step 1: Correct the API key setup section**

Replace the `.env` instructions (README lines 20-30) with:

````markdown
1. **Set up your OpenFDA API Key**

   The server reads `OPENFDA_API_KEY` from its process environment. It is
   launched by your MCP client, so the key belongs in the `env` block of your
   client configuration (shown below) — **a `.env` file is not read.**

   Get a key from [OpenFDA API Key Registration](https://open.fda.gov/apis/authentication/).
   A key raises your limit from 40 to 240 requests per minute.

   Without a key, every tool call returns a configuration error rather than
   failing confusingly upstream. To run on the unauthenticated tier anyway,
   set `OPENFDA_ALLOW_KEYLESS=1` — note that tier reports no rate-limit
   headers, so exhausting it surfaces as slow, intermittent failures.

   > **Note:** Never commit your real API key to version control.
````

- [ ] **Step 2: Fix the example config**

In the JSON block, change the `args` array to include `-y` and add
`get-drugsfda` to `autoApprove`:

```json
              "args": [
                  "-y",
                  "@ythalorossy/openfda"
              ],
```

```json
              "autoApprove": [
                  "get-drug-by-name",
                  "get-drug-by-generic-name",
                  "get-drug-adverse-events",
                  "get-drugs-by-manufacturer",
                  "get-drug-safety-info",
                  "get-drug-by-ndc",
                  "get-drug-by-product-ndc",
                  "get-drugsfda"
              ]
```

Also replace the trailing sentence "Replace the asterisks with your actual API
key, or ensure it is loaded from your `.env` file." with "Replace the asterisks
with your actual API key."

Without `-y`, a first run can stall on npx's install confirmation prompt, which
a stdio MCP server cannot answer.

- [ ] **Step 3: Document the eighth tool**

Add `get-drugsfda` to the README Features list, describing it as returning full
Drugs@FDA application data for a given section and field.

- [ ] **Step 4: Remove the stale local-run `.env` line**

Replace README line 87's "Create a `.env` file for any required environment
variables." with: "Export `OPENFDA_API_KEY` in your shell before running
locally: `export OPENFDA_API_KEY=your_key`."

- [ ] **Step 5: Update CLAUDE.md**

In the Environment section, replace the `.env` claim with the same correction:
the key comes from the MCP client `env` block; `.env` is not read. Add a line
noting `OPENFDA_ALLOW_KEYLESS=1`. Update the test count in the Key Files section
to match the new total from `npm run test:ci`.

- [ ] **Step 6: Bump the version**

In `package.json`, set `"version": "1.1.0"`.

- [ ] **Step 7: Full verification**

Run: `npm run test:ci && npm run typecheck && npm run lint && npm run build:cli`
Expected: all green.

Then confirm the headline security fix by grepping the built output and a
simulated error path:

```bash
grep -rc "api_key=\${" dist/ || echo "no template-interpolated api_key in dist: good"
```

- [ ] **Step 8: Commit**

```bash
git add README.md CLAUDE.md package.json
git commit -m "docs: correct .env guidance, add -y and get-drugsfda; bump to 1.1.0

The package declares no dotenv dependency and never read .env, so the
setup instructions pointed users at a file that did nothing. The key comes
from the MCP client env block.

Also adds -y to the npx args so a first run cannot stall on the install
prompt, and documents the eighth tool.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Deferred, with reasons

- **P3-2** (generic-name lookups surface only repackagers) — needs a relevance
  heuristic for "originator label". Task 7's `matched_via` is a step toward it.
- **P3-3** (adverse-event aggregation) — new tool surface, not a defect.
  Confirmed `count=patient.reaction.reactionmeddrapt.exact` works and returns
  ranked terms, so this is ready to build when wanted.
- **P3-3, second half** (FAERS results appear clustered/unsorted) — needs
  investigation into whether openFDA supports a sort on that endpoint.
- **Functional `.env` loading** — deferred by decision; Task 9 documents current
  behavior truthfully.

## Operational follow-up (not a code change)

The API key leaked by published 1.0.19 is in that package's `dist/` and in
agent transcripts on disk. **Rotate it at
https://open.fda.gov/apis/authentication/.** No code change recalls a key that
has already been distributed.
