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

// `${path}:"` or `:"${value}` — the shape that assembles a term by hand. No
// whitespace around the colon, matching the real assembler's own literal
// (`${clause.path}:"${escapeSearchValue(clause.value)}"` in query.ts) — a
// looser `\s*` here also matches unrelated prose like `Invalid X format: "Y"`
// and turns the guard into permanent noise on innocent code.
const RAW_TERM = /\$\{[^}]*\}:"|:"\$\{/;

// The one file allowed to assemble a query string.
const ASSEMBLER = join('src', 'core', 'search', 'query.ts');

// TEMPORARY, removed in Phase 3 (Task 19) when src/drug/ is deleted. These are
// the 1.x tools that assemble terms by hand; they are the reason this guard
// exists. The test below fails once the directory is gone, forcing removal of
// this list rather than letting it become permanent.
const LEGACY_ALLOWED = sourceFiles('src').filter((f) => f.startsWith(join('src', 'drug')));

describe('query assembly is confined to one file', () => {
  it('no source outside core/search/query.ts builds a search term by hand', () => {
    const offenders = sourceFiles('src')
      .filter((file) => file !== ASSEMBLER)
      .filter((file) => !LEGACY_ALLOWED.includes(file))
      .filter((file) => RAW_TERM.test(readFileSync(file, 'utf8')));
    expect(
      offenders,
      'Assembling `path:"value"` outside the assembler skips escapeSearchValue, which is how a ' +
        'caller-supplied value can append a clause and make the server answer about a different drug.'
    ).toEqual([]);
  });

  it('the legacy allowance is removed once src/drug/ is gone', () => {
    const stillThere = sourceFiles('src').some((f) => f.startsWith(join('src', 'drug')));
    expect(
      stillThere,
      'src/drug/ is gone — delete LEGACY_ALLOWED and this test from tests/no-raw-query.test.ts'
    ).toBe(true);
  });
});
