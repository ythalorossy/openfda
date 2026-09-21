import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';

/**
 * Whether this run should be treated as CI. Not a truthiness check on
 * `process.env.CI` — that would treat `CI=false` and `CI=0` (both used by
 * real runners to mean "not CI") as truthy strings and fail the build guard
 * below spuriously. Instead, CI is "set" unless it is explicitly one of the
 * falsy spellings, or absent/empty.
 */
export function isCI(env: Record<string, string | undefined>): boolean {
  const ci = env.CI;
  return (
    ci !== undefined &&
    ci !== '' &&
    ci !== '0' &&
    ci.toLowerCase() !== 'false'
  );
}

/**
 * The catalogs are imported, so they are bundled into dist/index.js. That is
 * deliberate — it is what makes the resources work without a separate file
 * copy — but it must not grow without anyone noticing.
 *
 * This assertion is only meaningful after a build, so a local `npm test`
 * (which does not build first) skips it as a convenience. In CI, though, a
 * silent skip is exactly how this guard could stop protecting anything and
 * have nothing fail to say so — so when CI is set, a missing dist/index.js
 * is itself a failure, not a skip: it means the workflow that is supposed to
 * build before testing didn't, and the guard below never ran.
 */
describe('published bundle size', () => {
  it('stays under 1 MB', () => {
    if (!existsSync('dist/index.js')) {
      if (isCI(process.env)) {
        throw new Error(
          'dist/index.js is missing under CI. The bundle-size guard needs a ' +
            'build to run against — the CI workflow must run `npm run build` ' +
            '(or `npm run build:cli`) before `npm run test:ci`.'
        );
      }
      return; // local convenience only: unbuilt dev checkouts are not held to this
    }
    expect(statSync('dist/index.js').size).toBeLessThan(1_000_000);
  });
});

describe('isCI', () => {
  const cases: Array<[string | undefined, boolean]> = [
    [undefined, false],
    ['', false],
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
    ['TRUE', true],
    ['False', false],
  ];

  for (const [value, expected] of cases) {
    it(`CI=${JSON.stringify(value)} -> ${expected}`, () => {
      expect(isCI({ CI: value })).toBe(expected);
    });
  }
});
