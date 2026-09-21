/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export interface Envelope<T> {
  matched_via: string;
  skip?: number;
  total: number | null;
  returned: number;
  limit: number;
  results: T[];
}

/**
 * The one response shape every endpoint returns.
 *
 * `total` is the upstream match count, never the caller's limit — "Found 3"
 * reads as a total to every consumer and makes "past the limit"
 * indistinguishable from "not present". `null` means openFDA did not report
 * one, which it never does on aggregated responses.
 */
export function buildEnvelope<T>(
  matchedVia: string,
  results: T[],
  total: number | undefined,
  limit: number,
  skip?: number
): Envelope<T> {
  return {
    matched_via: matchedVia,
    ...(skip !== undefined ? { skip } : {}),
    total: typeof total === 'number' ? total : null,
    returned: results.length,
    limit,
    results,
  };
}
