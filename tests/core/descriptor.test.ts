import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateDescriptor, type EndpointDescriptor } from '../../src/core/descriptor';

const base = (): EndpointDescriptor => ({
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search drug labels.',
  fields: [
    { name: 'brand_name', description: 'Brand', strategy: { kind: 'exact', path: 'openfda.brand_name' } },
  ],
  defaultField: 'brand_name',
  projections: [
    { name: 'summary', description: 'd', returnsFields: ['brand_name'], project: () => ({ brand_name: [] }) },
  ],
  sortFields: [],
  countFields: ['openfda.route'],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
});

describe('validateDescriptor', () => {
  it('accepts a well-formed descriptor', () => {
    expect(validateDescriptor(base())).toEqual([]);
  });

  it('rejects a descriptor with no fields', () => {
    const d = { ...base(), fields: [] };
    expect(validateDescriptor(d)).toContain('drug-label: must declare at least one field');
  });

  it('rejects duplicate field names, which would make one unreachable', () => {
    const d = base();
    d.fields = [d.fields[0]!, { ...d.fields[0]! }];
    expect(validateDescriptor(d)).toContain('drug-label: duplicate field name "brand_name"');
  });

  it('rejects a defaultField that is not a declared field', () => {
    const d = { ...base(), defaultField: 'nope' };
    expect(validateDescriptor(d)).toContain('drug-label: defaultField "nope" is not a declared field');
  });

  it('rejects a projection that declares no fields, which would defeat the drift guard', () => {
    const d = base();
    d.projections = [{ ...d.projections[0]!, returnsFields: [] }];
    expect(validateDescriptor(d)).toContain('drug-label: projection "summary" declares no returnsFields');
  });

  it('rejects a code map for a field that cannot be counted', () => {
    const d = { ...base(), codeMaps: { serious: { '1': 'Serious' } } };
    expect(validateDescriptor(d)).toContain(
      'drug-label: codeMaps has "serious" but it is not in countFields'
    );
  });

  it('rejects an incoherent limit range', () => {
    const d = { ...base(), limits: { default: 50, max: 25 } };
    expect(validateDescriptor(d)).toContain('drug-label: limits.default 50 exceeds limits.max 25');
  });

  it('rejects a field strategy that declares no paths', () => {
    const d = base();
    d.fields = [
      { name: 'brand_name', description: 'Brand', strategy: { kind: 'anyOf', paths: [] } },
    ];
    d.defaultField = 'brand_name';
    expect(validateDescriptor(d)).toContain(
      'drug-label: field "brand_name" strategy declares no paths'
    );
  });

  it('accepts a field strategy with multiple declared paths', () => {
    const d = base();
    d.fields = [
      {
        name: 'brand_name',
        description: 'Brand',
        strategy: { kind: 'anyOf', paths: ['openfda.brand_name', 'openfda.generic_name'] },
      },
    ];
    d.defaultField = 'brand_name';
    expect(validateDescriptor(d)).toEqual([]);
  });

  it.each([
    ['dataset', 'dataset must not be empty'],
    ['endpoint', 'endpoint must not be empty'],
    ['toolName', 'toolName must not be empty'],
    ['summary', 'summary must not be empty'],
    ['catalog', 'catalog must not be empty'],
  ] as const)('rejects a blank %s', (key, expected) => {
    const d = { ...base(), [key]: '   ' };
    const prefix = key === 'toolName' ? '   ' : 'drug-label';
    expect(validateDescriptor(d)).toContain(`${prefix}: ${expected}`);
  });

  it.each(['limit', 'sort'] as const)(
    'rejects an extraFilters.schema key that collides with the built-in "%s" parameter',
    (name) => {
      const d = {
        ...base(),
        extraFilters: {
          schema: { [name]: z.string().optional() },
          toClauses: () => [],
        },
      };
      expect(validateDescriptor(d)).toContain(
        `drug-label: extraFilters.schema declares "${name}", which collides with the built-in parameter of the same name`
      );
    }
  );

  it('accepts an extraFilters.schema key that does not collide with a built-in', () => {
    const d = {
      ...base(),
      extraFilters: {
        schema: { seriousness: z.string().optional() },
        toClauses: () => [],
      },
    };
    expect(validateDescriptor(d)).toEqual([]);
  });
});
