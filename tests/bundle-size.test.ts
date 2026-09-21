import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';

/**
 * The catalogs are imported, so they are bundled into dist/index.js. That is
 * deliberate — it is what makes the resources work without a separate file
 * copy — but it must not grow without anyone noticing.
 */
describe('published bundle size', () => {
  it('stays under 1 MB', () => {
    if (!existsSync('dist/index.js')) return; // only meaningful after a build
    expect(statSync('dist/index.js').size).toBeLessThan(1_000_000);
  });
});
