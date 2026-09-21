/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { z } from 'zod';
import type { EndpointDescriptor } from './descriptor.js';
import { validateDescriptor } from './descriptor.js';
import {
  execute,
  SKIP_MAX,
  type ExecuteInput,
  type McpResult,
} from './executor.js';
import type { ToolManager } from '../ToolManager.js';

/** Keys every endpoint's record response carries. */
export const ENVELOPE_FIELDS = [
  'matched_via',
  'total',
  'returned',
  'limit',
  'results',
] as const;

const asEnum = (values: readonly string[]): [string, ...string[]] =>
  values as unknown as [string, ...string[]];

/**
 * Compose the tool description from the descriptor.
 *
 * It must NAME every field each projection guarantees: a capability a model
 * cannot see in the schema does not exist as far as the model is concerned,
 * and the drift guard asserts exactly this.
 */
export function buildDescription(descriptor: EndpointDescriptor): string {
  const fields = descriptor.fields
    .map((field) => `${field.name} (${field.description})`)
    .join('; ');

  const details = descriptor.projections
    .map(
      (projection) =>
        `"${projection.name}" — ${projection.description} Returns: ${projection.returnsFields.join(', ')}.`
    )
    .join(' ');

  const counting =
    descriptor.countFields.length > 0
      ? ` Set count to rank values by frequency instead of returning records; it returns {term, term_code, count} and no total, because openFDA omits one on aggregated responses. Countable fields: ${descriptor.countFields.join(', ')}.`
      : '';

  const sorting =
    descriptor.sortFields.length > 0
      ? ` Order with sort (${descriptor.sortFields.join(', ')}); without it, results are a deterministic slice, so a small sample is not representative.`
      : '';

  return (
    `${descriptor.summary} Search one field at a time: field + value. ` +
    `Searchable fields: ${fields}. ` +
    `Always returns ${ENVELOPE_FIELDS.join(', ')}, where matched_via is the real path that matched ` +
    `and total is the upstream match count, not the number returned. ` +
    `detail selects the record shape: ${details}` +
    `${counting}${sorting} ` +
    `Page with limit (max ${descriptor.limits.max}, default ${descriptor.limits.default}) and skip (max ${SKIP_MAX}).`
  );
}

export function buildInputSchema(
  descriptor: EndpointDescriptor
): z.ZodObject<z.ZodRawShape> {
  const fieldNames = descriptor.fields.map((field) => field.name);
  const detailNames = descriptor.projections.map(
    (projection) => projection.name
  );

  const shape: z.ZodRawShape = {
    field: z
      .enum(asEnum(fieldNames))
      .optional()
      .default(descriptor.defaultField ?? fieldNames[0]!)
      .describe(`Field to search. One of: ${fieldNames.join(', ')}`),
    value: z.string().min(1).describe('Value to search for.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(descriptor.limits.max)
      .optional()
      .default(descriptor.limits.default)
      .describe('Maximum number of records to return.'),
    skip: z
      .number()
      .int()
      .min(0)
      .max(SKIP_MAX)
      .optional()
      .describe(`Offset into the result set. Maximum ${SKIP_MAX}.`),
    detail: z
      .enum(asEnum(detailNames))
      .optional()
      .default(detailNames[0]!)
      .describe(`Record shape. One of: ${detailNames.join(', ')}`),
  };

  if (descriptor.sortFields.length > 0) {
    shape.sort = z
      .enum(asEnum(descriptor.sortFields))
      .optional()
      .describe('Result ordering.');
  }
  if (descriptor.countFields.length > 0) {
    shape.count = z
      .enum(asEnum(descriptor.countFields))
      .optional()
      .describe('Aggregate by this field instead of returning records.');
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
