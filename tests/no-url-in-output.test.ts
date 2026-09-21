import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execute } from '../src/core/executor';
import { drugLabel } from '../src/datasets/drug/label';

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

  it('never interpolates url-ish identifiers in handler output (stricter check for src/core and src/datasets)', () => {
    // This test applies stricter rules to the descriptor-driven request
    // pipeline (src/core) and the endpoint descriptors (src/datasets), which
    // together produce every tool's user-facing output, to catch evasions of
    // the simpler bare-identifier check above.
    // Deliberately scoped away from src/OpenFDABuilder.ts, which legitimately
    // interpolates ${this.urlBase} when building the request URL, and lives
    // directly in src/, not under src/core or src/datasets, so it is not
    // subject to this stricter rule.
    const handlerFiles = [
      ...sourceFiles('src/core'),
      ...sourceFiles('src/datasets'),
    ].filter((file) => {
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
    expect(handlerFiles).toEqual([]);
  });
});

describe('tool error output', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'SUPERSECRETKEY' };
    // Force the upstream-error path, which is where the key leaked.
    globalThis.fetch = (async () => ({
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
    // A single-tier field (ndc) rather than the default tiered drug_name
    // field, so this test's one retried fetch fits comfortably inside the
    // timeout below instead of four tiers' worth of retries.
    const result = await execute(drugLabel, {
      field: 'ndc',
      value: '12345-1234',
    });
    const text = result.content[0]!.text;

    expect(result.isError).toBe(true);
    expect(text).not.toContain('SUPERSECRETKEY');
    expect(text).not.toContain('api_key');
    expect(text).not.toContain('api.fda.gov');
  }, 15000);

  it('never contains the api key on the rejected-argument (bad_request) path', async () => {
    // The beforeEach's empty-body 500 above never reaches badArgumentText:
    // JSON.parse('') throws inside badArgumentDetail, so that outcome
    // classifies as a generic `error`, not `bad_request`. This test supplies
    // a real illegal_argument_exception body so the bad_request branch (and
    // its own executor.ts message builder, badArgumentText) actually runs,
    // proving the key still cannot leak through that specific code path.
    const details =
      '[illegal_argument_exception] Text fields are not optimised for operations that ' +
      'require per-document field data like aggregations and sorting. Please use a ' +
      'keyword field instead.';
    globalThis.fetch = (async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () =>
        JSON.stringify({
          error: {
            code: 'SERVER_ERROR',
            message: 'Check your request and try again',
            details,
          },
        }),
      json: async () => ({}),
    })) as any;

    const result = await execute(drugLabel, {
      field: 'ndc',
      value: '12345-1234',
      count: 'openfda.route.exact',
    });
    const text = result.content[0]!.text;

    // Confirms the bad_request path (not the generic error path) actually
    // rendered this output.
    expect(text).toContain('keyword field');
    expect(result.isError).toBe(true);
    expect(text).not.toContain('SUPERSECRETKEY');
    expect(text).not.toContain('api_key');
    expect(text).not.toContain('api.fda.gov');
  }, 15000);
});
