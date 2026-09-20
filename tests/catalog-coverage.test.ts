import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const ENDPOINTS = ['label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages'];

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
  }
});
