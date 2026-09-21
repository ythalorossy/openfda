/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { z } from 'zod';
import {
  declaredPaths,
  type Clause,
  type SearchStrategy,
} from './search/strategy.js';

/** One entry in a tool's `field` enum: a real path, or a virtual search. */
export interface FieldSpec {
  name: string;
  strategy: SearchStrategy;
  description: string;
  /** Some openFDA fields are stored uppercase, e.g. drugsfda sponsor_name. */
  uppercase?: boolean;
  /** Reject or rewrite the raw value before querying, e.g. NDC normalization. */
  normalize?: (
    raw: string
  ) => { ok: true; value: string } | { ok: false; message: string };
}

/** A named view of a record. `detail` selects one of these. */
export interface Projection {
  name: string;
  description: string;
  // Upstream openFDA records are genuinely untyped and vary per record.
  project: (record: any) => Record<string, unknown>;
  /** Keys this projection always emits. The drift guard checks both halves. */
  returnsFields: readonly string[];
}

/** Endpoint-specific parameters, ANDed onto the main clause group. */
export interface ExtraFilters {
  schema: z.ZodRawShape;
  toClauses: (input: Record<string, unknown>) => Clause[];
}

/**
 * The tool-input keys `registry.ts` sets itself: `field`, `value`, `limit`,
 * `skip`, `detail` unconditionally, `sort`/`count` when the descriptor
 * declares any. Defined here, not in `registry.ts`, because `registry.ts`
 * already imports this module — the reverse import would cycle. Both
 * `validateDescriptor` and `registry.ts` read this one list, so a future
 * built-in parameter only needs adding here to be reserved everywhere.
 */
export const RESERVED_PARAM_NAMES = [
  'field',
  'value',
  'limit',
  'skip',
  'detail',
  'sort',
  'count',
] as const;

export interface EndpointDescriptor {
  dataset: string;
  endpoint: string;
  toolName: string;
  summary: string;
  fields: FieldSpec[];
  defaultField?: string;
  /** `projections[0]` is the default value of `detail`. */
  projections: Projection[];
  extraFilters?: ExtraFilters;
  sortFields: readonly string[];
  countFields: readonly string[];
  /** query path -> raw code -> human label */
  codeMaps: Record<string, Record<string, string>>;
  limits: { default: number; max: number };
  /** Repo-relative path to the committed FDA field catalog. */
  catalog: string;
}

const stripExact = (path: string): string => path.replace(/\.exact$/, '');

/**
 * Structural checks a descriptor must pass before it is registered. Returns
 * every problem found, so one run reports all of them.
 */
export function validateDescriptor(descriptor: EndpointDescriptor): string[] {
  const problems: string[] = [];
  const at = (message: string): void => {
    problems.push(`${descriptor.toolName}: ${message}`);
  };

  const isBlank = (value: string): boolean => value.trim().length === 0;
  if (isBlank(descriptor.dataset)) at('dataset must not be empty');
  if (isBlank(descriptor.endpoint)) at('endpoint must not be empty');
  if (isBlank(descriptor.toolName)) at('toolName must not be empty');
  if (isBlank(descriptor.summary)) at('summary must not be empty');
  if (isBlank(descriptor.catalog)) at('catalog must not be empty');

  if (descriptor.fields.length === 0) at('must declare at least one field');

  const seenFields = new Set<string>();
  for (const field of descriptor.fields) {
    if (seenFields.has(field.name)) at(`duplicate field name "${field.name}"`);
    seenFields.add(field.name);
    if (declaredPaths(field.strategy).length === 0) {
      at(`field "${field.name}" strategy declares no paths`);
    }
  }

  if (descriptor.defaultField && !seenFields.has(descriptor.defaultField)) {
    at(`defaultField "${descriptor.defaultField}" is not a declared field`);
  }

  if (descriptor.projections.length === 0)
    at('must declare at least one projection');

  const seenProjections = new Set<string>();
  for (const projection of descriptor.projections) {
    if (seenProjections.has(projection.name))
      at(`duplicate projection "${projection.name}"`);
    seenProjections.add(projection.name);
    if (projection.returnsFields.length === 0) {
      at(`projection "${projection.name}" declares no returnsFields`);
    }
  }

  const countable = new Set(descriptor.countFields.map(stripExact));
  for (const path of Object.keys(descriptor.codeMaps)) {
    if (!countable.has(stripExact(path))) {
      at(`codeMaps has "${path}" but it is not in countFields`);
    }
  }

  const reserved: readonly string[] = RESERVED_PARAM_NAMES;
  for (const key of Object.keys(descriptor.extraFilters?.schema ?? {})) {
    if (reserved.includes(key)) {
      at(
        `extraFilters.schema declares "${key}", which collides with the built-in parameter of the same name`
      );
    }
  }

  if (descriptor.limits.default < 1) at('limits.default must be at least 1');
  if (descriptor.limits.default > descriptor.limits.max) {
    at(
      `limits.default ${descriptor.limits.default} exceeds limits.max ${descriptor.limits.max}`
    );
  }

  return problems;
}
