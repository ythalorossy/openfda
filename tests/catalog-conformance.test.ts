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

  it('is actually checking something, not vacuously passing over an empty list', () => {
    // Replaces the Phase-1 tripwire that asserted DRUG_ENDPOINTS.length === 0
    // (task 15 — drug-label — is the descriptor that trips it). The
    // replacement proves the per-path loop above ran against real data,
    // rather than merely existing without generating any assertions.
    expect(
      DRUG_ENDPOINTS.length,
      'DRUG_ENDPOINTS is empty; the per-path checks above have nothing to run against.'
    ).toBeGreaterThan(0);

    const descriptor = DRUG_ENDPOINTS[0]!;
    const catalog = JSON.parse(readFileSync(descriptor.catalog, 'utf8'));
    const known = new Set<string>(catalog.fields.map((f: { path: string }) => f.path));

    const referenced = [
      ...descriptor.fields.flatMap((field) => declaredPaths(field.strategy)),
      ...descriptor.sortFields.map((s) => s.split(':')[0]!),
      ...descriptor.countFields,
      ...Object.keys(descriptor.codeMaps),
    ].map(stripExact);

    // The `it` loop above only emits assertions when there is something to
    // check — confirm this descriptor actually fed it real paths.
    expect(referenced.length).toBeGreaterThan(0);
    for (const path of referenced) {
      expect(known.has(path), `${path} should be a real, checked path`).toBe(true);
    }

    // Prove the guard is not trivially true: a fabricated path (the exact
    // shape of the 1.1.0 fabricated-field bug this guard exists to catch)
    // is genuinely absent from FDA's own published catalog, so a descriptor
    // that referenced it would fail the per-path checks above instead of
    // sailing through.
    const fabricated = 'openfda.definitely_not_a_real_field';
    expect(known.has(fabricated)).toBe(false);
  });
});

describe('every descriptor is structurally valid', () => {
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

describe('every countField can actually be aggregated by openFDA', () => {
  // Countability is a property of openFDA's index mapping, not of the
  // published field reference: a path can be published, populated, and
  // still rejected for aggregation. It is measured by
  // `npm run fields:countable` and committed beside the catalog.
  //
  // The load-bearing property here is that a MISSING entry FAILS. A guard
  // that passed over unprobed fields would be the same hole this exists to
  // close: at 2.0.0 all 14 broken fields passed schema validation and
  // failed at the API.
  for (const descriptor of DRUG_ENDPOINTS) {
    const path = `src/catalog/drug-${descriptor.endpoint}.countable.json`;
    const probed = JSON.parse(readFileSync(path, 'utf8')).countable as Record<string, boolean>;

    for (const field of descriptor.countFields) {
      it(`${descriptor.toolName}: "${field}" is countable`, () => {
        expect(
          Object.prototype.hasOwnProperty.call(probed, field),
          `${descriptor.toolName} declares countField "${field}", which was never probed. ` +
            `Run npm run fields:countable — an unprobed field is not a passing field.`
        ).toBe(true);

        const alternate = field.endsWith('.exact')
          ? field.slice(0, -'.exact'.length)
          : `${field}.exact`;
        const hint = probed[alternate] === true ? ` Use "${alternate}" instead.` : '';

        expect(
          probed[field],
          `${descriptor.toolName} declares countField "${field}", but openFDA rejects ` +
            `aggregating it (measured in ${path}).${hint}`
        ).toBe(true);
      });
    }
  }

  it('is actually checking something, not vacuously passing over an empty list', () => {
    const declared = DRUG_ENDPOINTS.flatMap((d) => d.countFields);
    expect(declared.length, 'no countFields declared anywhere').toBeGreaterThan(0);

    // Prove the guard is not trivially true: a fabricated path is absent
    // from every probed map, so a descriptor declaring it would fail the
    // per-field checks above rather than sail through.
    for (const descriptor of DRUG_ENDPOINTS) {
      const probed = JSON.parse(
        readFileSync(`src/catalog/drug-${descriptor.endpoint}.countable.json`, 'utf8')
      ).countable as Record<string, boolean>;
      expect(Object.prototype.hasOwnProperty.call(probed, 'definitely_not_a_real_field')).toBe(
        false
      );
    }
  });
});
