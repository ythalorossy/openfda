import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

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

  it('the built bundle reports the current package version', () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    let bundle: string;
    try {
      bundle = readFileSync('dist/index.js', 'utf8');
    } catch {
      return; // dist is gitignored; skip when the build has not run
    }
    expect(bundle).toContain(version);
  });
});
