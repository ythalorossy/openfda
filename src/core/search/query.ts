/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { escapeSearchValue } from './escape.js';
import type { Clause, ClauseSet } from './strategy.js';

const term = (clause: Clause): string =>
  `${clause.path}:"${escapeSearchValue(clause.value)}"`;

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
 */
export function buildQuery(
  set: ClauseSet,
  filters: readonly Clause[] = []
): string {
  const group = set.clauses.map(term).join(` ${set.op} `);
  if (filters.length === 0) return group;
  return `(${group}) AND ${filters.map(term).join(' AND ')}`;
}
