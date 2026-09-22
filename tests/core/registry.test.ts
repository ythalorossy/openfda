import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildDescription, buildInputSchema, toToolDefinition } from '../../src/core/registry';
import { RESERVED_PARAM_NAMES, type EndpointDescriptor } from '../../src/core/descriptor';
import { COUNT_BUCKET_DEFAULT } from '../../src/core/executor';

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
    for (const key of [
      'matched_via',
      'total',
      'returned',
      'limit',
      'dropped_for_budget',
      'next_skip',
      'results',
    ]) {
      expect(description).toContain(key);
    }
  });

  it('lists the detail values, but not the searchable fields (those live on the field parameter)', () => {
    const description = buildDescription(descriptor);
    expect(description).toContain('summary');
    // Field names and descriptions are paid for once, on the `field`
    // parameter's own .describe() (see buildInputSchema below) — repeating
    // them in the always-loaded tool description doubles the cost for
    // nothing. This is the fix for the schema-budget regression the first
    // real descriptor (drug-label) found: enumerating every field here on
    // top of the field parameter blew the per-tool budget.
    expect(description).not.toContain('drug_name');
  });

  it('omits the count-mode bucket clause for a descriptor with no countFields', () => {
    // The bucket-default clause must be gated the same way `counting` (the
    // "Set count to rank by frequency..." sentence) and the `count`
    // parameter itself are: a descriptor with no countFields has no count
    // mode at all, so advertising a bucket default for it would tell the
    // same false story Finding 2 fixed, just inverted.
    const description = buildDescription({ ...descriptor, countFields: [] });
    expect(description).not.toContain('buckets');
    expect(description).not.toContain('with count set');
    // The limit and skip text must still be present, unconditionally.
    expect(description).toContain(`Limit max ${descriptor.limits.max}`);
    expect(description).toContain('skip max');
  });
});

describe('buildInputSchema', () => {
  const schema = buildInputSchema(descriptor);

  it('defaults field and detail so the simplest call is value-only', () => {
    const parsed = schema.parse({ value: 'Advil' });
    expect(parsed.field).toBe('drug_name');
    expect(parsed.detail).toBe('summary');
  });

  it('leaves limit absent so the executor can tell records from buckets', () => {
    // A Zod .default() here made input.limit always populated, so `count`
    // could not be given its own ceiling: drug-label's record default of 1
    // became a one-bucket aggregation. The default is documented in
    // .describe() and applied in execute() instead.
    const parsed = schema.parse({ value: 'Advil' });
    expect(parsed.limit).toBeUndefined();
    expect(schema.shape.limit.description).toContain(String(COUNT_BUCKET_DEFAULT));
  });

  it('rejects a field outside the enum', () => {
    expect(() => schema.parse({ value: 'Advil', field: 'nope' })).toThrow();
  });

  it('names every field, with its own description, once — on the field parameter itself', () => {
    // `.describe()` sits on the outermost wrapper (ZodDefault around
    // ZodOptional around ZodEnum); `.description` reads it back regardless
    // of the wrapping.
    const fieldDescribe = schema.shape.field.description ?? '';
    expect(fieldDescribe).toContain('drug_name');
    expect(fieldDescribe).toContain('Brand, generic or substance name, tried in that order.');
  });

  it('enforces the endpoint limit ceiling', () => {
    expect(() => schema.parse({ value: 'Advil', limit: 26 })).toThrow();
  });

  it('known, accepted asymmetry: an explicit limit under count is still rejected above the record ceiling, even though the unset bucket default (100) exceeds it', () => {
    // Documented in docs/superpowers/specs/2026-09-21-2.0.1-count-and-paging-design.md
    // ("Known asymmetry, documented not fixed"): lifting this cap only under
    // count would need a second always-loaded schema parameter, rejected
    // against the schema-budget ceiling. This pins the current, intentional
    // behaviour so a future change to it is a deliberate decision, not a
    // silent drift.
    expect(() => schema.parse({ value: 'Advil', count: 'openfda.route', limit: 50 })).toThrow();
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

  // buildInputSchema's own collision check derives from Object.keys(shape),
  // not from RESERVED_PARAM_NAMES — see the comment in registry.ts. That
  // means this constant (which validateDescriptor DOES check against,
  // since it cannot build a shape without cycling into registry.ts) can
  // drift away from what buildInputSchema actually sets. This test is the
  // thing that turns that drift into a loud failure: `descriptor` above
  // already declares both sortFields and countFields, so every conditional
  // built-in key is present, and the built shape must match the constant
  // exactly — no extras, no omissions.
  it('pins RESERVED_PARAM_NAMES to the built-in keys buildInputSchema actually sets', () => {
    const shape = buildInputSchema(descriptor).shape;
    expect(new Set(Object.keys(shape))).toEqual(new Set(RESERVED_PARAM_NAMES));
  });
});
