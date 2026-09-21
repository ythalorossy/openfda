import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const ENDPOINTS = ['label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages'];

// A path that is genuinely present on nearly every record for its endpoint,
// per the committed coverage data (each measured at 100% as of this writing).
// Used as a floor to catch a run where a swallowed request failure silently
// zeroed out every field — shape-only checks can't tell that apart from real
// zero coverage, but this field can't legitimately fall anywhere near zero.
// The floor is set well below 100% so ordinary upstream drift doesn't trip it.
const KNOWN_POPULATED: Record<string, string> = {
  label: 'id',
  event: 'receivedate',
  ndc: 'product_ndc',
  enforcement: 'classification',
  drugsfda: 'application_number',
  orangebook: 'product_number',
  shortages: 'generic_name',
};
const KNOWN_POPULATED_FLOOR_PCT = 90;

describe('field coverage data', () => {
  for (const endpoint of ENDPOINTS) {
    const file = `src/catalog/drug-${endpoint}.coverage.json`;

    it(`${endpoint}: coverage file is well-formed`, () => {
      expect(existsSync(file), `${file} missing — run npm run fields:coverage`).toBe(true);
      const data = JSON.parse(readFileSync(file, 'utf8'));
      expect(data.endpoint).toBe(endpoint);
      expect(data.total_records).toBeGreaterThan(0);
      expect(Array.isArray(data.fields)).toBe(true);
      expect(data.fields.length).toBeGreaterThan(0);
      for (const field of data.fields) {
        expect(typeof field.path).toBe('string');
        expect(field.docs).toBeGreaterThanOrEqual(0);
        expect(field.coverage_pct).toBeGreaterThanOrEqual(0);
        expect(field.coverage_pct).toBeLessThanOrEqual(100);
      }
    });

    it(`${endpoint}: every measured path is in the catalog`, () => {
      const coverage = JSON.parse(readFileSync(file, 'utf8'));
      const catalog = JSON.parse(readFileSync(`src/catalog/drug-${endpoint}.json`, 'utf8'));
      const known = new Set(catalog.fields.map((f: { path: string }) => f.path));
      for (const field of coverage.fields) expect(known.has(field.path)).toBe(true);
    });

    it(`${endpoint}: coverage values are not all zero`, () => {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      const fields: Array<{ path: string; docs: number; coverage_pct: number }> = data.fields;
      // Catches a run where every request silently failed and got recorded
      // as a 0-coverage field — shape checks alone can't distinguish that
      // from real (rare but legitimate) zero coverage on individual fields.
      expect(fields.some((f) => f.docs > 0)).toBe(true);

      const knownPath = KNOWN_POPULATED[endpoint];
      const known = fields.find((f) => f.path === knownPath);
      expect(known, `${knownPath} missing from ${file}`).toBeDefined();
      expect(known!.coverage_pct).toBeGreaterThanOrEqual(KNOWN_POPULATED_FLOOR_PCT);
    });
  }
});
