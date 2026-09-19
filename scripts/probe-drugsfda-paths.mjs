// Manual. Re-validates every advertised drugsfda path against the live API.
// This is the check that found six fabricated paths in 1.1.0.
// Run: node scripts/probe-drugsfda-paths.mjs
import { readFileSync } from 'node:fs';

const source = readFileSync('src/drug/drugsfda-sections.ts', 'utf8');
const KEY = process.env.OPENFDA_API_KEY;

// Extract prefix/field pairs from the table without importing TypeScript.
// Field bodies are extracted with balanced-brace scanning rather than a
// `[^}]*` regex: an empty field def like `application_number: {}` closes
// on the very first `}`, so a naive regex stops there and silently drops
// every field declared after the first one in each section.
function extractBalanced(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(openBraceIndex + 1, i);
    }
  }
  throw new Error('Unbalanced braces while parsing drugsfda-sections.ts');
}

const probes = [];
const sectionHeader = /(\w+):\s*\{\s*prefix:\s*'([^']*)',\s*fields:\s*\{/g;
let match;
while ((match = sectionHeader.exec(source))) {
  const [full, name, prefix] = match;
  const fieldsOpenBrace = match.index + full.lastIndexOf('{');
  const body = extractBalanced(source, fieldsOpenBrace);
  for (const [, field] of body.matchAll(/(\w+):\s*\{/g)) {
    probes.push({ name, path: prefix ? `${prefix}.${field}` : field });
  }
}

let bad = 0;
for (const { name, path } of probes) {
  const qs = new URLSearchParams({ search: `_exists_:${path}`, limit: '1' });
  if (KEY) qs.set('api_key', KEY);
  const res = await fetch(`https://api.fda.gov/drug/drugsfda.json?${qs}`);
  const json = await res.json();
  const ok = !json.error && json.meta?.results?.total > 0;
  if (!ok) bad += 1;
  console.log(`  ${ok ? 'ok  ' : 'BAD '} ${name.padEnd(18)} ${path}`);
  await new Promise((r) => setTimeout(r, 60));
}

console.log(`\n${probes.length} paths probed, ${bad} invalid`);
process.exit(bad === 0 ? 0 : 1);
