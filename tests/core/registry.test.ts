import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildDescription, buildInputSchema, toToolDefinition } from '../../src/core/registry';
import type { EndpointDescriptor } from '../../src/core/descriptor';

const descriptor: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search FDA drug product labels (SPL).',
  fields: [
    {
      name: 'drug_name',
      description: 'Brand, generic or substance name, tried in that order.',
      strategy: { kind: 'tiered', paths: ['openfda.brand_name', 'openfda.generic_name'] },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity plus the safety narrative.',
      returnsFields: ['brand_name', 'boxed_warning'],
      project: (record: any) => ({
        brand_name: record?.openfda?.brand_name ?? [],
        boxed_warning: record?.boxed_warning ?? [],
      }),
    },
  ],
  sortFields: ['effective_time:desc'],
  countFields: ['openfda.route'],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
};

describe('buildDescription', () => {
  it('names every field a projection guarantees, so the drift guard can hold', () => {
    const description = buildDescription(descriptor);
    expect(description).toContain('brand_name');
    expect(description).toContain('boxed_warning');
  });

  it('names the envelope keys it always returns', () => {
    const description = buildDescription(descriptor);
    for (const key of ['matched_via', 'total', 'returned', 'limit', 'results']) {
      expect(description).toContain(key);
    }
  });

  it('lists the searchable fields and the detail values', () => {
    const description = buildDescription(descriptor);
    expect(description).toContain('drug_name');
    expect(description).toContain('summary');
  });
});

describe('buildInputSchema', () => {
  const schema = buildInputSchema(descriptor);

  it('defaults field and detail so the simplest call is value-only', () => {
    const parsed = schema.parse({ value: 'Advil' });
    expect(parsed.field).toBe('drug_name');
    expect(parsed.detail).toBe('summary');
    expect(parsed.limit).toBe(1);
  });

  it('rejects a field outside the enum', () => {
    expect(() => schema.parse({ value: 'Advil', field: 'nope' })).toThrow();
  });

  it('enforces the endpoint limit ceiling', () => {
    expect(() => schema.parse({ value: 'Advil', limit: 26 })).toThrow();
  });

  it('enforces openFDA skip ceiling', () => {
    expect(() => schema.parse({ value: 'Advil', skip: 25001 })).toThrow();
  });

  it('omits sort and count when the endpoint declares none', () => {
    const bare = buildInputSchema({ ...descriptor, sortFields: [], countFields: [] });
    expect('sort' in bare.shape).toBe(false);
    expect('count' in bare.shape).toBe(false);
  });
});

describe('toToolDefinition', () => {
  it('produces a registrable tool named after the descriptor', () => {
    const tool = toToolDefinition(descriptor);
    expect(tool.name).toBe('drug-label');
    expect(typeof tool.handler).toBe('function');
    expect(tool.returnsFields).toContain('matched_via');
  });

  it('refuses to build a tool from an invalid descriptor', () => {
    expect(() => toToolDefinition({ ...descriptor, projections: [] })).toThrow(/projection/);
  });
});

describe('extraFilters vs. built-in parameter names', () => {
  it.each(['limit', 'sort'] as const)(
    'refuses to build the schema when extraFilters.schema collides with the built-in "%s"',
    (name) => {
      const withCollision: EndpointDescriptor = {
        ...descriptor,
        extraFilters: { schema: { [name]: z.string().optional() }, toClauses: () => [] },
      };
      expect(() => buildInputSchema(withCollision)).toThrow(/collides/);
      expect(() => toToolDefinition(withCollision)).toThrow(/collides/);
    }
  );

  it('still builds a clean schema, and reaches it, for a legitimately-named extra filter', () => {
    const withSeriousness: EndpointDescriptor = {
      ...descriptor,
      extraFilters: { schema: { seriousness: z.string().optional() }, toClauses: () => [] },
    };
    const schema = buildInputSchema(withSeriousness);
    expect('seriousness' in schema.shape).toBe(true);
    expect(schema.parse({ value: 'Advil', seriousness: 'serious' }).seriousness).toBe('serious');
    expect(() => toToolDefinition(withSeriousness)).not.toThrow();
  });
});
