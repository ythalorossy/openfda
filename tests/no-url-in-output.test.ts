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
