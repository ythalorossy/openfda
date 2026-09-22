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
import { decodeTerm, type DecodedTerm } from './codes.js';
import { summarizeResults } from '../utils/format.js';
import { SKIP_MAX } from './paging.js';
import type { OpenFDAError } from '../types.js';

/**
 * openFDA's own default bucket ceiling, verified live 2026-09-21: a
 * search-free count with no `limit` returns at most 100 terms. Stated
 * explicitly rather than relied on implicitly.
 *
 * This is a generic property of openFDA aggregation, not drug knowledge, so
 * it belongs here and not in seven descriptors.
 */
export const COUNT_BUCKET_DEFAULT = 100;

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
 * A rejected argument is not a caller mistake here: `input.count` was already
 * checked against `descriptor.countFields`, so reaching this means the
 * descriptor is stale relative to openFDA's index mapping. The suffix flip is
 * the fix in every case observed so far (2.0.0 shipped 14 of them), so it is
 * offered as a suggestion rather than presented as a fact.
 */
function badArgumentText(
  descriptor: EndpointDescriptor,
  input: ExecuteInput,
  detail: string
): string {
  if (input.count === undefined) {
    // Without `count`, `sort` is the likeliest source of an
    // illegal_argument_exception — openFDA raises it for a field its index
    // will not sort — so name it. Named, not blamed: nothing here proves it
    // was the refused parameter.
    return (
      `openFDA rejected this ${descriptor.toolName} request as malformed: ${detail}\n\n` +
      (input.sort !== undefined
        ? `sort "${input.sort}" was sent and is declared sortable by this tool; check it ` +
          "against openFDA's current index first. "
        : '') +
      'This indicates a defect in the tool, not a problem with your input.'
    );
  }
  const flipped = input.count.endsWith('.exact')
    ? input.count.slice(0, -'.exact'.length)
    : `${input.count}.exact`;

  // openFDA's illegal_argument_exception pattern covers both aggregations
  // (count) and sorting (sort) — see http.ts's badArgumentDetail doc
  // comment — and the rejection does not say which parameter it refused.
  // With both present on the same request, blaming count alone would send a
  // maintainer to the wrong diagnostic when sort was the actual cause.
  if (input.sort !== undefined) {
    return (
      `Cannot process this ${descriptor.toolName} request: ${detail}\n\n` +
      `Both count "${input.count}" and sort "${input.sort}" were sent, and openFDA's ` +
      `rejection does not say which one it refused. "${input.count}" is declared countable ` +
      `by this tool ("${flipped}" is the usual working form; npm run fields:countable checks ` +
      `it), and "${input.sort}" is declared sortable, for which no equivalent probe exists ` +
      `yet. Check both against openFDA's current index before assuming which one drifted.`
    );
  }

  return (
    `Cannot aggregate ${descriptor.toolName} by "${input.count}": ${detail}\n\n` +
    `"${input.count}" is declared countable by this tool, so openFDA's index no longer ` +
    `matches the committed measurement. "${flipped}" is the usual working form. ` +
    'To fix the tool, run npm run fields:countable and correct the descriptor.'
  );
}

/**
 * The one request pipeline. Every endpoint tool is this function plus a
 * descriptor, which is why escaping, parenthesisation, the skip ceiling, the
 * response budget and the five outcomes (hit, miss, rejected argument,
 * upstream error, input error) cannot vary between tools.
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
  // `limit` is openFDA's ceiling for two different quantities. For records it
  // is rows; for an aggregation it is buckets, which is why an absent limit
  // must stay absent all the way to here (see buildInputSchema).
  const limit =
    input.count !== undefined
      ? (input.limit ?? COUNT_BUCKET_DEFAULT)
      : (input.limit ?? descriptor.limits.default);

  let hit: { set: ClauseSet; data: UpstreamPage } | null = null;
  let lastError: OpenFDAError | null = null;
  const attempted: string[] = [];

  for (const set of planned) {
    attempted.push(set.matched_via);

    // A `clauses` strategy's build() is arbitrary, descriptor-author code:
    // it can emit a path buildQuery's SAFE_PATH guard rejects, or (in a
    // shape planClauseSets can't see in advance) an unsafe clause. That is
    // a broken descriptor, not a bad user value, and letting it escape as
    // an unhandled rejection would surface as "the tool crashed" instead of
    // a clean, actionable error.
    let search: string;
    try {
      search = buildQuery(set, filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return fail(
        `Internal error building the query for ${descriptor.toolName} — this indicates a defect in the tool's descriptor, not a problem with your input. Details: ${message}`
      );
    }

    const outcome = await fetchPage<UpstreamPage>({
      dataset: descriptor.dataset,
      endpoint: descriptor.endpoint,
      search,
      limit,
      skip: input.skip,
      sort: input.sort,
      count: input.count,
    });
    // A rejected argument fails identically on every tier, so walking the
    // rest only multiplies latency and then reports the wrong outcome.
    if (outcome.kind === 'bad_request') {
      return fail(badArgumentText(descriptor, input, outcome.detail));
    }
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
    const countedVia = hit.set.matched_via;
    // Aggregations go through the same budget as records, for the same
    // reason: `COUNT_BUCKET_DEFAULT` raised the ceiling to 100 buckets on
    // every tool, and a FAERS generic-name term is routinely hundreds of
    // characters, so 100 of them breach 60,000. `fitToBudget` re-renders with
    // successively smaller slices and keeps the last render, so `returned`
    // and the drop count must be computed from the slice this invocation was
    // handed — not from `rows` — or they describe a payload that was thrown
    // away.
    //
    // It gains `dropped_for_budget` and NOT `next_skip`: capping without
    // reporting is the defect class this release exists to close, but an
    // aggregation has no result total and no skip semantics, so an offset to
    // resume from would be a number with no meaning behind it.
    const renderCount = (kept: readonly (DecodedTerm & { count: number })[]) =>
      JSON.stringify(
        {
          matched_via: countedVia,
          counted_by: input.count,
          returned: kept.length,
          // An aggregation carries no total, so `returned === limit` is the
          // only signal available that buckets were cut off upstream.
          limit,
          dropped_for_budget: rows.length - kept.length,
          results: kept,
        },
        null,
        2
      );

    const { text, kept, dropped } = fitToBudget(rows, renderCount);

    return succeed(
      `Top ${kept} values of ${input.count} for "${value}" ` +
        `(aggregated responses carry no result total)` +
        (dropped > 0
          ? ` — ${dropped} omitted to stay within the response budget`
          : '') +
        `\n\n${text}`
    );
  }

  // --- record response ------------------------------------------------------
  const total = hit.data.meta?.results?.total;
  const projected = applyProjection(projection, hit.data.results);
  const matchedVia = hit.set.matched_via;

  const render = (rows: readonly Record<string, unknown>[]): string =>
    JSON.stringify(
      buildEnvelope(
        matchedVia,
        [...rows],
        total,
        limit,
        input.skip,
        projected.length - rows.length
      ),
      null,
      2
    );

  const { text, kept, dropped } = fitToBudget(projected, render);

  const nextSkip = JSON.parse(text).next_skip as number | null;

  const header =
    summarizeResults(
      kept,
      total,
      `${descriptor.toolName} records matching ${matchedVia}`
    ) +
    (input.skip !== undefined ? `, starting at offset ${input.skip}` : '') +
    (dropped > 0
      ? ` (${dropped} omitted to stay within the response budget)`
      : '') +
    (nextSkip !== null ? ` — continue from offset ${nextSkip}` : '');

  return succeed(`${header}\n\n${text}`);
}
