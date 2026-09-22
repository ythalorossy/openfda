/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { z } from 'zod';
import type { EndpointDescriptor } from './descriptor.js';
import { validateDescriptor } from './descriptor.js';
import {
  execute,
  COUNT_BUCKET_DEFAULT,
  type ExecuteInput,
  type McpResult,
} from './executor.js';
import { SKIP_MAX } from './paging.js';
import type { ToolManager } from '../ToolManager.js';

/** Keys every endpoint's record response carries. */
export const ENVELOPE_FIELDS = [
  'matched_via',
  'total',
  'returned',
  'limit',
  'dropped_for_budget',
  'next_skip',
  'results',
] as const;

const asEnum = (values: readonly string[]): [string, ...string[]] =>
  values as unknown as [string, ...string[]];

/**
 * Compose the tool description from the descriptor.
 *
 * It must NAME every field each projection guarantees: a capability a model
 * cannot see in the schema does not exist as far as the model is concerned,
 * and the drift guard asserts exactly this. That guarantee is about
 * *returned* fields (via each projection's `Returns: ...` clause below).
 *
 * Searchable fields are a separate guarantee, named once in the `field`
 * parameter's own `.describe()` (see `buildInputSchema`) — NOT repeated
 * here. Enumerating every field's name-plus-description a second time in
 * this always-loaded tool description is what blew the per-tool schema
 * budget on the first real descriptor: the field list is exactly the part
 * of the schema an agent reads to pick a field, and it already lives on the
 * `field` parameter, so paying for it twice bought nothing.
 */
export function buildDescription(descriptor: EndpointDescriptor): string {
  const details = descriptor.projections
    .map(
      (projection) =>
        `"${projection.name}" — ${projection.description} Returns: ${projection.returnsFields.join(', ')}.`
    )
    .join(' ');

  // Trimmed 2026-09-20: this fixed prose repeated, byte-for-byte, on every
  // registered tool — ~540-560 characters of always-loaded schema cost per
  // tool that said nothing descriptor-specific. The two facts a model
  // actually needs (the envelope keys are always present, and `total` is
  // the upstream match count rather than the returned count — a real 1.x
  // defect) are kept; the restated "where matched_via is the real path
  // that matched" and "see the field parameter for the searchable fields"
  // clauses were dropped because the field parameter is self-describing
  // and matched_via's meaning is already implied by its name.
  const counting =
    descriptor.countFields.length > 0
      ? ` Set count to rank by frequency instead of records ({term, term_code, count}, no total). Countable: ${descriptor.countFields.join(', ')}.`
      : '';

  const sorting =
    descriptor.sortFields.length > 0
      ? ` Order with sort (${descriptor.sortFields.join(', ')}); default order is a deterministic slice.`
      : '';

  // Gated the same way `counting` above is: a descriptor with no
  // countFields gets no `count` parameter at all (see buildInputSchema), so
  // this tool has no bucket mode for the always-loaded description to
  // describe.
  const countLimit =
    descriptor.countFields.length > 0
      ? `with count set, ${COUNT_BUCKET_DEFAULT} buckets unless limit is given; `
      : '';

  return (
    `${descriptor.summary} Search one field at a time: field + value. ` +
    `Always returns ${ENVELOPE_FIELDS.join(', ')}; total is the upstream match count, not the number returned. ` +
    `detail selects the record shape: ${details}` +
    `${counting}${sorting} ` +
    `Limit max ${descriptor.limits.max} (default ${descriptor.limits.default}); ` +
    `${countLimit}skip max ${SKIP_MAX}.`
  );
}

export function buildInputSchema(
  descriptor: EndpointDescriptor
): z.ZodObject<z.ZodRawShape> {
  const fieldNames = descriptor.fields.map((field) => field.name);
  const detailNames = descriptor.projections.map(
    (projection) => projection.name
  );

  // The one place field names AND their descriptions are spelled out: this
  // parameter is what an agent reads to choose a field, so it is the only
  // place that cost belongs. buildDescription deliberately does not repeat it.
  const fieldList = descriptor.fields
    .map((field) => `${field.name} (${field.description})`)
    .join('; ');

  const shape: z.ZodRawShape = {
    field: z
      .enum(asEnum(fieldNames))
      .optional()
      .default(descriptor.defaultField ?? fieldNames[0]!)
      .describe(`Field: ${fieldList}`),
    value: z.string().min(1).describe('Search value.'),
    // No .default(): `execute` must be able to tell an explicit limit from
    // an absent one, because `count` needs its own ceiling. openFDA counts
    // buckets with the same `limit` parameter it pages records with, and the
    // two want different defaults — drug-label's record default of 1 turned
    // every aggregation into a single bucket.
    limit: z
      .number()
      .int()
      .min(1)
      .max(descriptor.limits.max)
      .optional()
      .describe(
        `Max records to return (default ${descriptor.limits.default}); ` +
          `with count set, caps buckets instead (default ${COUNT_BUCKET_DEFAULT}).`
      ),
    skip: z
      .number()
      .int()
      .min(0)
      .max(SKIP_MAX)
      .optional()
      .describe(`Offset for paging. Max ${SKIP_MAX}.`),
    detail: z
      .enum(asEnum(detailNames))
      .optional()
      .default(detailNames[0]!)
      .describe(`Shape: ${detailNames.join(', ')}`),
  };

  if (descriptor.sortFields.length > 0) {
    shape.sort = z
      .enum(asEnum(descriptor.sortFields))
      .optional()
      .describe('Sort order.');
  }
  if (descriptor.countFields.length > 0) {
    shape.count = z
      .enum(asEnum(descriptor.countFields))
      .optional()
      .describe('Aggregate by this field instead of records.');
  }
  // The keys already on `shape` at this point ARE the built-ins this
  // function sets (field/value/limit/skip/detail, plus sort/count when
  // declared) — checking against `Object.keys(shape)` rather than a second,
  // hand-maintained list makes drift structurally impossible here: a new
  // built-in added above is reserved the instant it lands, with nothing
  // else to remember. (`descriptor.ts`'s `RESERVED_PARAM_NAMES` is a
  // separate static mirror `validateDescriptor` uses, since it cannot build
  // a shape without importing this module and cycling; a pinning test keeps
  // the two in agreement — see `tests/core/registry.test.ts`.)
  const builtIn = new Set(Object.keys(shape));
  for (const [key, schema] of Object.entries(
    descriptor.extraFilters?.schema ?? {}
  )) {
    if (builtIn.has(key)) {
      throw new Error(
        `${descriptor.toolName}: extraFilters.schema declares "${key}", which collides with the built-in parameter of the same name`
      );
    }
    shape[key] = schema;
  }

  return z.object(shape);
}

export function toToolDefinition(descriptor: EndpointDescriptor): {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  returnsFields: readonly string[];
  handler: (input: ExecuteInput) => Promise<McpResult>;
} {
  const problems = validateDescriptor(descriptor);
  if (problems.length > 0) {
    throw new Error(`Invalid descriptor:\n- ${problems.join('\n- ')}`);
  }

  return {
    name: descriptor.toolName,
    description: buildDescription(descriptor),
    inputSchema: buildInputSchema(descriptor),
    returnsFields: [
      ...ENVELOPE_FIELDS,
      ...descriptor.projections.flatMap(
        (projection) => projection.returnsFields
      ),
    ],
    handler: (input: ExecuteInput) => execute(descriptor, input),
  };
}

/** Register a whole API group. Fails loudly at startup on a bad descriptor. */
export function registerDataset(
  toolManager: ToolManager,
  descriptors: readonly EndpointDescriptor[]
): void {
  for (const descriptor of descriptors) {
    toolManager.registerTool(toToolDefinition(descriptor));
  }
}
