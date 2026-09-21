/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import type { OpenFDAError } from '../types.js';

export interface PageRequest {
  dataset: string;
  endpoint: string;
  search: string;
  limit: number;
  skip?: number;
  sort?: string;
  count?: string;
}

export type PageOutcome<T> =
  | { kind: 'hit'; data: T }
  | { kind: 'miss' }
  | { kind: 'bad_request'; detail: string }
  | { kind: 'error'; error: OpenFDAError };

interface ResultsBody {
  results?: unknown[];
}

/**
 * openFDA reports a rejected argument two different ways, both verified live
 * 2026-09-21:
 *
 *   - HTTP 500, `error.details` carrying `[illegal_argument_exception] Text
 *     fields are not optimised for ... aggregations ... Please use a keyword
 *     field instead.` — a text-mapped path used for `count`.
 *   - HTTP 404, `NOT_FOUND` / `"Nothing to count"` — an aggregation path that
 *     does not exist on this endpoint.
 *
 * Neither is an outage and neither is data, so both must be distinguishable
 * from `error` and `miss`. The discriminator sits on the message string,
 * because a zero-match search answers with the SAME 404 NOT_FOUND envelope
 * and the message `"No matches found!"` — with or without `count`. An
 * unrecognised message therefore falls through to the existing
 * classification rather than being guessed at; the offline countability
 * guard is the primary defence and this is the backstop.
 */
function badArgumentDetail(error: OpenFDAError): string | null {
  let upstream:
    | { code?: string; message?: string; details?: unknown }
    | undefined;
  try {
    upstream = JSON.parse(String(error.details ?? ''))?.error;
  } catch {
    return null;
  }
  if (!upstream) return null;

  const details = typeof upstream.details === 'string' ? upstream.details : '';
  if (details.includes('illegal_argument_exception')) return details;

  if (
    error.status === 404 &&
    upstream.code === 'NOT_FOUND' &&
    upstream.message === 'Nothing to count'
  ) {
    return 'openFDA reports "Nothing to count": the aggregation path does not exist on this endpoint.';
  }
  return null;
}

/**
 * openFDA answers a zero-match search with 404 and a JSON NOT_FOUND envelope.
 * It also answers a bogus dataset or endpoint path with a bare 404 and a
 * non-JSON body — verified live 2026-09-20. Classifying on status alone would
 * turn a descriptor typo (a misspelled dataset or endpoint) into a permanent,
 * silent "no records found", so the body is what decides.
 */
function isNoMatches(error: OpenFDAError): boolean {
  if (error.status !== 404) return false;
  try {
    return JSON.parse(String(error.details ?? ''))?.error?.code === 'NOT_FOUND';
  } catch {
    return false;
  }
}

/**
 * One openFDA page request, classified into the three outcomes the executor
 * must keep apart.
 *
 * Verified live 2026-09-20: a zero-match search returns HTTP 404 with
 * `error.code: NOT_FOUND`. That is data, not a failure, so it is a MISS. Any
 * other non-2xx — including a 404 that is not openFDA's NOT_FOUND envelope —
 * is a genuine upstream error and must stay distinguishable — a caller has to
 * be able to tell "this drug has no recalls" from "we could not reach
 * openFDA".
 */
export async function fetchPage<T>(
  request: PageRequest
): Promise<PageOutcome<T>> {
  const builder = new OpenFDABuilder()
    .dataset(request.dataset)
    .endpoint(request.endpoint)
    .search(request.search)
    .limit(request.limit);

  if (request.skip !== undefined) builder.skip(request.skip);
  if (request.sort !== undefined) builder.sort(request.sort);
  if (request.count !== undefined) builder.count(request.count);

  const { data, error } = await makeOpenFDARequest<T & ResultsBody>(
    builder.build()
  );

  if (error) {
    const detail = badArgumentDetail(error);
    if (detail) return { kind: 'bad_request', detail };
    return isNoMatches(error) ? { kind: 'miss' } : { kind: 'error', error };
  }
  if (!data?.results || data.results.length === 0) return { kind: 'miss' };
  return { kind: 'hit', data };
}
