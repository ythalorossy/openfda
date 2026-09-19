import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const distExists = existsSync('dist/index.js');

describe('server version', () => {
  it('is not hardcoded in src/index.ts', () => {
    // serverInfo.version drifted to a stale 1.0.0 once already, because it was
    // a literal. It is now injected from package.json at build time by vite.
    const source = readFileSync('src/index.ts', 'utf8');
    expect(source).toMatch(/__APP_VERSION__/);
    expect(source).not.toMatch(/version:\s*'\d+\.\d+\.\d+'/);
  });

  it('vite injects the version from package.json', () => {
    const config = readFileSync('vite.config.ts', 'utf8');
    expect(config).toMatch(/__APP_VERSION__/);
    expect(config).toMatch(/package\.json/);
  });

  it.skipIf(!distExists)(
    'the built bundle reports the current package version',
    () => {
      // dist is gitignored; this explicitly skips (with a stated reason,
      // visible in the test run) rather than silently returning, so the
      // assertion never looks like it passed when it never ran.
      const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
      const bundle = readFileSync('dist/index.js', 'utf8');
      expect(bundle).toContain(version);
    }
  );
});
