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

  it('never interpolates url-ish identifiers in handler output (stricter check for src/drug/)', () => {
    // This test applies stricter rules to src/drug/ handlers that produce user-facing
    // output, to catch evasions of the simpler bare-identifier check.
    // Deliberately scoped to src/drug/ to avoid false positives: src/OpenFDABuilder.ts
    // legitimately interpolates ${this.urlBase} when building the request URL, and it
    // lives in src/, not src/drug/, so it is not subject to this stricter rule.
    const drugHandlers = sourceFiles('src/drug').filter((file) => {
      const source = readFileSync(file, 'utf8');
      // Catch template literals containing:
      //   ${url...} - any template with url in the interpolation (member access, calls, etc.)
      //   ${...url...} - member access like ${err.url}
      // Catch string concatenation with url-ish variables:
      //   'x' + url, url + 'y', etc.
      const hasUrlInterpolation = /\$\{[^}]*[uU]rl[^}]*\}/.test(source);
      const hasUrlConcatenation = /['"`]\s*\+\s*[A-Za-z]*[uU]rl\b|[A-Za-z]*[uU]rl\b\s*\+\s*['"`]/.test(source);
      return hasUrlInterpolation || hasUrlConcatenation;
    });
    expect(drugHandlers).toEqual([]);
  });
});

import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc.js';
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
      text: async () => '',
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
  }, 15000);
});
