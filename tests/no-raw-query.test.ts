import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

// `${path}:"` or `:"${value}` — the shape that assembles a term by hand.
// Whitespace around the colon is optional on purpose: Prettier does not
// reformat the contents of a template literal, so a hand-written spaced
// variant (`${path} : "${value}"`) would sit undetected forever under a
// tighter, no-whitespace pattern. A looser pattern risks false positives
// instead (see PROSE_EXCLUDED below) — an auditable one-file exclusion beats
// a globally weakened regex with a detection gap.
const RAW_TERM = /\$\{[^}]*\}\s*:\s*"|:\s*"\s*\$\{/;

// The one file allowed to assemble a query string.
const ASSEMBLER = join('src', 'core', 'search', 'query.ts');

// The one deliberate false positive under RAW_TERM: this file's user-facing
// error message — `Invalid ${label} format: "${input}"` — has a
// colon-space-quote from English prose, not a search term. Re-check this
// exclusion if that message ever changes shape.
const PROSE_EXCLUDED = join('src', 'utils', 'ndc-formats.ts');

// TEMPORARY, removed in Phase 3 (Task 19) when src/drug/ is deleted. These are
// the seven 1.x tools that assemble terms by hand; they are the reason this
// guard exists. Enumerated explicitly, not globbed, so a NEW file added under
// src/drug/ before Phase 3 is not silently exempt — it is caught by the guard
// like anything else outside the assembler.
const LEGACY_ALLOWED = [
  'event-search.ts',
  'get-drug-by-generic-name.ts',
  'get-drug-by-ndc.ts',
  'get-drug-by-product-ndc.ts',
  'get-drugs-by-manufacturer.ts',
  'get-drugsfda.ts',
  'resolve-label.ts',
].map((name) => join('src', 'drug', name));

describe('query assembly is confined to one file', () => {
  it('no source outside core/search/query.ts builds a search term by hand', () => {
    const offenders = sourceFiles('src')
      .filter((file) => file !== ASSEMBLER)
      .filter((file) => file !== PROSE_EXCLUDED)
      .filter((file) => !LEGACY_ALLOWED.includes(file))
      .filter((file) => RAW_TERM.test(readFileSync(file, 'utf8')));
    expect(
      offenders,
      'Assembling `path:"value"` outside the assembler skips escapeSearchValue, which is how a ' +
        'caller-supplied value can append a clause and make the server answer about a different drug.'
    ).toEqual([]);
  });

  it('the legacy allowance is removed once src/drug/ is gone', () => {
    const stillThere = LEGACY_ALLOWED.some((file) => existsSync(file));
    expect(
      stillThere,
      'src/drug/ is gone — delete LEGACY_ALLOWED and this test from tests/no-raw-query.test.ts'
    ).toBe(true);
  });
});
