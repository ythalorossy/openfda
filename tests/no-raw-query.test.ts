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

describe('query assembly is confined to one file', () => {
  it('no source outside core/search/query.ts builds a search term by hand', () => {
    const offenders = sourceFiles('src')
      .filter((file) => file !== ASSEMBLER)
      .filter((file) => file !== PROSE_EXCLUDED)
      .filter((file) => RAW_TERM.test(readFileSync(file, 'utf8')));
    expect(
      offenders,
      'Assembling `path:"value"` outside the assembler skips escapeSearchValue, which is how a ' +
        'caller-supplied value can append a clause and make the server answer about a different drug.'
    ).toEqual([]);
  });
});
