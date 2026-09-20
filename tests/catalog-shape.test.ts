import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const ENDPOINTS = [
  'label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages',
] as const;

// One path per endpoint that was verified live on 2026-09-20. If FDA's
// reference no longer lists it, that is real drift and this must fail.
const KNOWN_TRUE: Record<string, string> = {
  label: 'openfda.brand_name',
  event: 'patient.drug.medicinalproduct',
  ndc: 'product_ndc',
  enforcement: 'reason_for_recall',
  drugsfda: 'sponsor_name',
  orangebook: 'products.brand_name',
  shortages: 'generic_name',
};

describe('field catalogs', () => {
  for (const endpoint of ENDPOINTS) {
    const file = `src/catalog/drug-${endpoint}.json`;

    it(`${endpoint}: catalog exists and is well-formed`, () => {
      expect(existsSync(file), `${file} missing — run npm run fields:sync`).toBe(true);
      const catalog = JSON.parse(readFileSync(file, 'utf8'));
      expect(catalog.endpoint).toBe(endpoint);
      expect(typeof catalog.source_url).toBe('string');
      expect(typeof catalog.fetched_at).toBe('string');
      expect(Array.isArray(catalog.fields)).toBe(true);
      expect(catalog.fields.length).toBeGreaterThan(20);
      for (const field of catalog.fields) {
        expect(typeof field.path).toBe('string');
        expect(field.path.length).toBeGreaterThan(0);
        expect(typeof field.type).toBe('string');
        expect(typeof field.description).toBe('string');
      }
    });

    it(`${endpoint}: catalog lists its known-true path`, () => {
      const catalog = JSON.parse(readFileSync(file, 'utf8'));
      const paths = catalog.fields.map((f: { path: string }) => f.path);
      expect(paths).toContain(KNOWN_TRUE[endpoint]);
    });
  }

  // drugsfda.yaml has a fifth field shape none of the other six endpoints
  // use: an array whose `items` is itself a map of named child field
  // definitions with no `properties` wrapper (`submissions.application_docs`,
  // `submissions.submission_property_type`). A flattener that only walks
  // `properties`/`items.properties` silently drops these — verified live on
  // 2026-09-20, and four of the five `application_docs` fields are already
  // load-bearing in `src/drug/drugsfda-sections.ts`.
  const KNOWN_TRUE_DEEP_DRUGSFDA = [
    'submissions.application_docs.id',
    'submissions.application_docs.date',
    'submissions.application_docs.title',
    'submissions.application_docs.type',
    'submissions.application_docs.url',
    'submissions.submission_property_type.code',
  ];

  it('drugsfda: catalog lists its deeply-nested, wrapper-less field paths', () => {
    const catalog = JSON.parse(readFileSync('src/catalog/drug-drugsfda.json', 'utf8'));
    const paths = catalog.fields.map((f: { path: string }) => f.path);
    for (const deepPath of KNOWN_TRUE_DEEP_DRUGSFDA) {
      expect(paths).toContain(deepPath);
    }
  });
});
