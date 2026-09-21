import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';

const DOCS = ['README.md', 'CLAUDE.md', 'AGENTS.md'];
const RETIRED = [
  'get-drug-by-name', 'get-drug-by-generic-name', 'get-drug-adverse-events',
  'get-drugs-by-manufacturer', 'get-drug-safety-info', 'get-drug-by-ndc',
  'get-drug-by-product-ndc', 'get-drugsfda', 'get-drug-adverse-event-counts',
];

describe('documentation matches the shipped tool surface', () => {
  for (const doc of DOCS) {
    const text = readFileSync(doc, 'utf8');

    for (const descriptor of DRUG_ENDPOINTS) {
      it(`${doc} documents ${descriptor.toolName}`, () => {
        expect(text).toContain(descriptor.toolName);
      });
    }

    it(`${doc} does not present a retired tool as current`, () => {
      // README may name retired tools ONLY inside the migration table, which
      // is the one place they belong. Everywhere else is stale documentation.
      const body = doc === 'README.md' ? text.split('<!-- migration-table -->')[0]! : text;
      for (const retired of RETIRED) expect(body).not.toContain(retired);
    });
  }
});
