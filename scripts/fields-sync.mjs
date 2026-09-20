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
 * one of five shapes:
 *   1. a container: `{ type: 'object', properties: { ... } }`;
 *   2. an array of containers: `{ type: 'array', items: { properties: { ... } } }`;
 *   3. a leaf scalar: `{ type: 'string', description: '...' }` (no
 *      `properties`/`items.properties` of its own);
 *   4. an array of scalars: `{ type: 'array', items: { type: 'string',
 *      description: '...' } }` — `items` here carries no `properties`, so
 *      it is still a leaf; or
 *   5. an array of NAMED children with no `properties` wrapper at all —
 *      `drugsfda.yaml`'s `submissions.application_docs` and
 *      `submissions.submission_property_type` are the only two live
 *      instances: `items` is itself the map of child field names to child
 *      field definitions, e.g. `{ id: {...}, date: {...}, url: {...} }`.
 * Shape 5 is distinguished from shape 4 structurally, not by key name
 * (a child can legitimately be named `type`, colliding with the metadata
 * key `type`): shape 4's `items` holds the leaf's OWN metadata, so most of
 * its values are primitives (`description` is a string, `type` is a
 * string, ...). Shape 5's `items` holds child field definitions, so EVERY
 * one of its values is itself a plain object. Trusting key names instead
 * of this structural check misclassifies at least one live path: FDA's own
 * `drugshortages.yaml` has a malformed `openfda.dosage_form.items` with a
 * stray, valueless `generic_name:` key sitting beside the real metadata
 * keys — a name-based check would wrongly treat that as shape 5 and emit
 * six fabricated fields; the "every value is an object" check correctly
 * leaves it as shape 4 (a leaf) because its other values are all scalars.
 * Container paths (e.g. `openfda`, `patient.drug`) are emitted alongside
 * their children rather than skipped, since a search can target either.
 * Flatten everything to dotted paths, which is exactly the form a search
 * query uses.
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function implicitItemProperties(node) {
  const items = node?.items;
  if (!items || items.properties) return undefined;
  const values = Object.values(items);
  if (values.length === 0 || !values.every(isPlainObject)) return undefined;
  return items;
}

function flatten(node, prefix = '') {
  const out = [];
  const properties = node?.properties ?? node?.items?.properties ?? implicitItemProperties(node);
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
