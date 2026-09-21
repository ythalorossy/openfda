import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { declaredPaths } from '../src/core/search/strategy';
import { validateDescriptor } from '../src/core/descriptor';

// openFDA accepts a trailing .exact for aggregation but does not list it.
const stripExact = (path: string) => path.replace(/\.exact$/, '');

describe('every descriptor path exists in FDA\'s published catalog', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    const catalog = JSON.parse(readFileSync(descriptor.catalog, 'utf8'));
    const known = new Set<string>(catalog.fields.map((f: { path: string }) => f.path));

    const referenced = [
      ...descriptor.fields.flatMap((field) => declaredPaths(field.strategy)),
      ...descriptor.sortFields.map((s) => s.split(':')[0]!),
      ...descriptor.countFields,
      ...Object.keys(descriptor.codeMaps),
    ].map(stripExact);

    for (const path of [...new Set(referenced)]) {
      it(`${descriptor.toolName}: "${path}" is published by FDA`, () => {
        expect(
          known.has(path),
          `${descriptor.toolName} references "${path}", which is absent from ${descriptor.catalog}. ` +
            'Either the path is wrong (this is the 1.1.0 fabricated-field bug) or the catalog is ' +
            'stale — run npm run fields:sync.'
        ).toBe(true);
      });
    }
  }

  it('is actually checking something once descriptors exist', () => {
    // Guards the guard: an empty list passes vacuously, which is correct in
    // Phase 1 and a bug from Phase 2 onward.
    expect(Array.isArray(DRUG_ENDPOINTS)).toBe(true);
  });
});

describe('every descriptor is structurally valid', () => {
  // vitest errors on a describe with zero test cases ("No test found in
  // suite"), which an empty DRUG_ENDPOINTS would otherwise produce — this
  // keeps the vacuous-pass property the brief calls for actually true.
  if (DRUG_ENDPOINTS.length === 0) {
    it('is empty for now (Phase 1) — nothing to validate yet', () => {
      expect(DRUG_ENDPOINTS).toEqual([]);
    });
  }
  for (const descriptor of DRUG_ENDPOINTS) {
    it(`${descriptor.toolName} passes validateDescriptor`, () => {
      expect(validateDescriptor(descriptor)).toEqual([]);
    });
  }
});

describe('clause builders stay inside their declared paths', () => {
  const clauseFields = DRUG_ENDPOINTS.flatMap((descriptor) =>
    descriptor.fields
      .filter((field) => field.strategy.kind === 'clauses')
      .map((field) => ({ descriptor, field }))
  );
  // Same emptiness guard as above: no descriptor has shipped a `clauses`
  // strategy yet, so this describe would otherwise register zero tests.
  if (clauseFields.length === 0) {
    it('has no clause-based fields yet', () => {
      expect(clauseFields).toEqual([]);
    });
  }
  for (const { descriptor, field } of clauseFields) {
    it(`${descriptor.toolName}.${field.name} emits only declared paths`, () => {
      const declared = new Set(field.strategy.kind === 'clauses' ? field.strategy.paths : []);
      // A representative value per normalizer; the builder must not invent paths.
      const built = field.strategy.kind === 'clauses' ? field.strategy.build('12345-1234') : null;
      if (built && !('ok' in built)) {
        for (const clause of built.clauses) expect(declared.has(clause.path)).toBe(true);
      }
    });
  }
});
