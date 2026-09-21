/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type {
  EndpointDescriptor,
  FieldSpec,
  Projection,
} from './descriptor.js';
import { planClauseSets, type ClauseSet } from './search/strategy.js';
import { buildQuery } from './search/query.js';
import { fetchPage } from './http.js';
import { applyProjection } from './shape/project.js';
import { buildEnvelope } from './shape/envelope.js';
import { fitToBudget } from './shape/budget.js';
import { decodeTerm } from './codes.js';
import { summarizeResults } from '../utils/format.js';
import type { OpenFDAError } from '../types.js';

/** openFDA rejects a larger offset: "Skip value must 25000 or less." */
export const SKIP_MAX = 25000;

export interface McpResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface ExecuteInput {
  field?: string;
  value: string;
  limit?: number;
  skip?: number;
  sort?: string;
  count?: string;
  detail?: string;
  [key: string]: unknown;
}

const fail = (text: string): McpResult => ({
  content: [{ type: 'text', text }],
  isError: true,
});

const succeed = (text: string): McpResult => ({
  content: [{ type: 'text', text }],
});

interface CountRow {
  // openFDA sends coded fields as NUMBERS and text fields as strings.
  term: string | number;
  count: number;
}

interface UpstreamPage {
  meta?: { results?: { total?: number } };
  results: unknown[];
}

function notFoundText(
  descriptor: EndpointDescriptor,
  value: string,
  attempted: readonly string[]
): string {
  return (
    `No ${descriptor.toolName} records found for "${value}".\n\n` +
    `Searched, in order: ${attempted.join(', ')}.\n\n` +
    'Suggestions:\n' +
    '- Check the spelling.\n' +
    '- Try a generic or substance name rather than a brand.\n' +
    '- Try a different field; this endpoint indexes several.\n' +
    '- Some records simply do not exist for every product.'
  );
}

/**
 * The one request pipeline. Every endpoint tool is this function plus a
 * descriptor, which is why escaping, parenthesisation, the skip ceiling, the
 * response budget and the four error outcomes cannot vary between tools.
 */
export async function execute(
  descriptor: EndpointDescriptor,
  input: ExecuteInput
): Promise<McpResult> {
  // --- resolve the field -------------------------------------------------
  const fieldName =
    input.field ?? descriptor.defaultField ?? descriptor.fields[0]?.name;
  const spec: FieldSpec | undefined = descriptor.fields.find(
    (f) => f.name === fieldName
  );
  if (!spec) {
    const valid = descriptor.fields.map((f) => f.name).join(', ');
    return fail(
      `Unknown field "${fieldName}" for ${descriptor.toolName}. Valid fields: ${valid}.`
    );
  }

  // --- validate the value, before any network call ------------------------
  let value = (input.value ?? '').trim();
  if (value.length === 0)
    return fail(`value must not be empty for ${descriptor.toolName}.`);

  if (spec.normalize) {
    const normalized = spec.normalize(value);
    if (!normalized.ok) return fail(normalized.message);
    value = normalized.value;
  }
  if (spec.uppercase) value = value.toUpperCase();

  if (input.skip !== undefined && input.skip > SKIP_MAX) {
    return fail(
      `skip must be ${SKIP_MAX} or less (openFDA's ceiling); received ${input.skip}. ` +
        'To reach records beyond that, narrow the search or use sort to bring them into range.'
    );
  }

  if (
    input.count !== undefined &&
    !descriptor.countFields.includes(input.count)
  ) {
    const valid = descriptor.countFields.join(', ') || 'none';
    return fail(
      `Cannot count by "${input.count}" on ${descriptor.toolName}. Countable fields: ${valid}.`
    );
  }

  const projection: Projection | undefined = input.detail
    ? descriptor.projections.find((p) => p.name === input.detail)
    : descriptor.projections[0];
  if (!projection) {
    const valid = descriptor.projections.map((p) => p.name).join(', ');
    return fail(
      `Unknown detail "${input.detail}" for ${descriptor.toolName}. Valid: ${valid}.`
    );
  }

  const planned = planClauseSets(spec.strategy, value);
  if ('ok' in planned) return fail(planned.message);

  // --- query ---------------------------------------------------------------
  const filters = descriptor.extraFilters?.toClauses(input) ?? [];
  const limit = input.limit ?? descriptor.limits.default;

  let hit: { set: ClauseSet; data: UpstreamPage } | null = null;
  let lastError: OpenFDAError | null = null;
  const attempted: string[] = [];

  for (const set of planned) {
    attempted.push(set.matched_via);
    const outcome = await fetchPage<UpstreamPage>({
      dataset: descriptor.dataset,
      endpoint: descriptor.endpoint,
      search: buildQuery(set, filters),
      limit,
      skip: input.skip,
      sort: input.sort,
      count: input.count,
    });
    // A miss on one tier is expected, not fatal: keep walking.
    if (outcome.kind === 'miss') continue;
    if (outcome.kind === 'error') {
      lastError = outcome.error;
      continue;
    }
    hit = { set, data: outcome.data };
    break;
  }

  if (!hit) {
    // An error anywhere with no hit is an upstream failure; all-miss is data.
    if (lastError) {
      return fail(
        `Failed to query ${descriptor.toolName} for "${value}": ${lastError.message}`
      );
    }
    return succeed(notFoundText(descriptor, value, attempted));
  }

  // --- aggregated response --------------------------------------------------
  if (input.count !== undefined) {
    const rows = (hit.data.results as CountRow[]).map((row) => ({
      ...decodeTerm(descriptor.codeMaps, input.count as string, row.term),
      count: row.count,
    }));
    const payload = {
      matched_via: hit.set.matched_via,
      counted_by: input.count,
      returned: rows.length,
      results: rows,
    };
    return succeed(
      `Top ${rows.length} values of ${input.count} for "${value}" ` +
        `(aggregated responses carry no result total)\n\n${JSON.stringify(payload, null, 2)}`
    );
  }

  // --- record response ------------------------------------------------------
  const total = hit.data.meta?.results?.total;
  const projected = applyProjection(projection, hit.data.results);
  const matchedVia = hit.set.matched_via;

  const render = (rows: readonly Record<string, unknown>[]): string =>
    JSON.stringify(
      buildEnvelope(matchedVia, [...rows], total, limit, input.skip),
      null,
      2
    );

  const { text, kept, dropped } = fitToBudget(projected, render);

  const header =
    summarizeResults(
      kept,
      total,
      `${descriptor.toolName} records matching ${matchedVia}`
    ) +
    (input.skip !== undefined ? `, starting at offset ${input.skip}` : '') +
    (dropped > 0
      ? ` (${dropped} omitted to stay within the response budget)`
      : '');

  return succeed(`${header}\n\n${text}`);
}
