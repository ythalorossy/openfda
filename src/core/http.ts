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
  | { kind: 'error'; error: OpenFDAError };

interface ResultsBody {
  results?: unknown[];
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
    return isNoMatches(error) ? { kind: 'miss' } : { kind: 'error', error };
  }
  if (!data?.results || data.results.length === 0) return { kind: 'miss' };
  return { kind: 'hit', data };
}
