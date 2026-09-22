/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { SKIP_MAX } from '../paging.js';

export interface Envelope<T> {
  matched_via: string;
  skip?: number;
  total: number | null;
  returned: number;
  limit: number;
  dropped_for_budget: number;
  next_skip: number | null;
  results: T[];
}

/**
 * The one response shape every endpoint returns.
 *
 * `total` is the upstream match count, never the caller's limit — "Found 3"
 * reads as a total to every consumer and makes "past the limit"
 * indistinguishable from "not present". `null` means openFDA did not report
 * one, which it never does on aggregated responses.
 *
 * `next_skip` exists because `skip += limit` is the obvious paging idiom and
 * it is wrong: the response budget drops trailing rows, so advancing by
 * `limit` steps over exactly the rows that were dropped. Advancing by
 * `returned` is correct, and this is that arithmetic done once, here, rather
 * than inferred by every caller. It is `null` when the set is exhausted, and
 * also when the next offset would exceed `SKIP_MAX` — handing back an offset
 * the tool itself would reject is the same class of defect as handing back
 * one that skips records.
 *
 * `dropped_for_budget` is always present, 0 included. A key that appears only
 * sometimes is a key a consumer has to guess about, and before 2.0.1 the drop
 * count existed only in the prose header.
 */
export function buildEnvelope<T>(
  matchedVia: string,
  results: T[],
  total: number | undefined,
  limit: number,
  skip?: number,
  droppedForBudget = 0
): Envelope<T> {
  const start = skip ?? 0;
  const next = start + results.length;
  const exhausted = typeof total === 'number' && next >= total;

  return {
    matched_via: matchedVia,
    ...(skip !== undefined ? { skip } : {}),
    total: typeof total === 'number' ? total : null,
    returned: results.length,
    limit,
    dropped_for_budget: droppedForBudget,
    next_skip: exhausted || next > SKIP_MAX ? null : next,
    results,
  };
}
