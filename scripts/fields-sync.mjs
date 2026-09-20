#!/usr/bin/env node
/*
 * Downloads openFDA's published field reference for each drug endpoint and
 * writes a trimmed, committed catalog. Hits the live API; NOT part of npm test.
 *
 * The catalog is the offline source of truth that tests/catalog-conformance
 * checks descriptors against, so a field name that FDA does not publish can
 * never reach a tool schema.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const ENDPOINTS = {
  label: 'druglabel',
  event: 'drugevent',
  ndc: 'drugndc',
  enforcement: 'drugenforcement',
  drugsfda: 'drugsfda',
  orangebook: 'drugorangebook',
  shortages: 'drugshortages',
};

const MAX_DESCRIPTION = 300;

/**
 * openFDA's reference is a tree of nodes keyed by `properties`. A node is
 * either:
 *   - a container: `{ type: 'object', properties: { ... } }`, or
 *   - an array of containers: `{ type: 'array', items: { properties: { ... } } }`,
 *   - a leaf scalar: `{ type: 'string', description: '...' }` (no
 *     `properties`/`items.properties` of its own), or
 *   - an array of scalars: `{ type: 'array', items: { type: 'string',
 *     description: '...' } }` — `items` here carries no `properties`, so it
 *     is still a leaf.
 * Container paths (e.g. `openfda`, `patient.drug`) are emitted alongside
 * their children rather than skipped, since a search can target either.
 * Flatten everything to dotted paths, which is exactly the form a search
 * query uses.
 */
function flatten(node, prefix = '') {
  const out = [];
  const properties = node?.properties ?? node?.items?.properties;
  if (!properties) return out;
  for (const [name, value] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${name}` : name;
    const type = value?.type ?? value?.items?.type ?? 'unknown';
    const description = String(value?.description ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_DESCRIPTION);
    const children = flatten(value, path);
    if (children.length === 0) out.push({ path, type, description });
    else out.push({ path, type, description }, ...children);
  }
  return out;
}

async function sync(endpoint, slug) {
  const sourceUrl = `https://open.fda.gov/fields/${slug}.yaml`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${sourceUrl} -> HTTP ${response.status}`);
  const doc = parse(await response.text());

  // The reference wraps the record schema; take whichever root carries properties.
  const root = doc?.properties ? doc : (Object.values(doc ?? {}).find((v) => v?.properties) ?? {});
  const fields = flatten(root);
  if (fields.length === 0) throw new Error(`${slug}: parsed 0 fields — reference shape changed`);

  const catalog = {
    endpoint,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    fields: fields.sort((a, b) => a.path.localeCompare(b.path)),
  };
  mkdirSync('src/catalog', { recursive: true });
  writeFileSync(`src/catalog/drug-${endpoint}.json`, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`drug-${endpoint}: ${fields.length} fields`);
}

for (const [endpoint, slug] of Object.entries(ENDPOINTS)) {
  await sync(endpoint, slug);
}
