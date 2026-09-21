/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { escapeSearchValue } from './escape.js';
import type { Clause, ClauseSet } from './strategy.js';

/**
 * A query path always originates from a descriptor, never from a caller —
 * but `path` is interpolated raw while only `value` is escaped, so the trust
 * boundary is enforced here rather than assumed at every call site. All 522
 * field paths across the seven committed FDA catalogs match this shape,
 * `.exact` suffixes included, so it rejects nothing legitimate.
 */
const SAFE_PATH = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/;

const term = (clause: Clause): string => {
  if (!SAFE_PATH.test(clause.path)) {
    throw new Error(`buildQuery: unsafe clause path '${clause.path}'`);
  }
  return `${clause.path}:"${escapeSearchValue(clause.value)}"`;
};

/**
 * The ONLY place an openFDA search string is assembled. Everything upstream
 * deals in clauses, so no caller can bypass escaping.
 *
 * The clause group is always parenthesised when filters are present:
 * `a OR b AND serious:"1"` binds the AND to `b` alone, which silently applies
 * the filter to one index instead of all of them.
 *
 * Quoting a numeric filter is safe — verified live 2026-09-20, `serious:1` and
 * `serious:"1"` both return 23,172 — so every term is quoted uniformly.
 *
 * An empty clause group is refused rather than silently rendered as `''`: an
 * empty `search` string sent to openFDA is not a no-op, and a descriptor with
 * `paths: []` would otherwise sail past both `validateDescriptor` and the
 * catalog-conformance guard with nothing to object to. This is the last line
 * of defence, not the only one — a matching check belongs in
 * `validateDescriptor` too, so a bad descriptor is caught at startup.
 */
export function buildQuery(
  set: ClauseSet,
  filters: readonly Clause[] = []
): string {
  if (set.clauses.length === 0) {
    throw new Error(
      'buildQuery: clause group is empty, refusing to build an unfiltered query'
    );
  }
  const group = set.clauses.map(term).join(` ${set.op} `);
  if (filters.length === 0) return group;
  return `(${group}) AND ${filters.map(term).join(' AND ')}`;
}
