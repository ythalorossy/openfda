/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Describe a truncated result set without implying the returned count is the
 * total. "Found 3" reads as a total to every consumer, human or model, and
 * makes "past the limit" indistinguishable from "not present".
 */
export function summarizeResults(
  returned: number,
  total: number | undefined,
  noun: string
): string {
  if (typeof total !== 'number') {
    return `Showing ${returned} ${noun} (total unknown)`;
  }
  if (returned >= total) {
    return `Showing all ${total} ${noun}`;
  }
  return `Showing ${returned} of ${total} ${noun}`;
}

/** Wrap results so the total is machine-readable, not only in the header. */
export function withTotals<T>(
  results: T[],
  total: number | undefined,
  limit: number
): { total: number | null; returned: number; limit: number; results: T[] } {
  return {
    total: typeof total === 'number' ? total : null,
    returned: results.length,
    limit,
    results,
  };
}
