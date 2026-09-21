/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * One `path:"value"` term. `value` is RAW here; only the assembler escapes.
 * `path` must originate from a descriptor's closed set of real field paths,
 * never from caller input — the assembler interpolates it raw and only
 * shape-checks it as a last line of defence, so this is the assumption that
 * check exists to catch a violation of, not a substitute for upholding it.
 */
export interface Clause {
  path: string;
  value: string;
}

/** One attempt: a group of clauses joined by `op`, plus what to report. */
export interface ClauseSet {
  clauses: Clause[];
  op: 'OR' | 'AND';
  matched_via: string;
}

export interface StrategyError {
  ok: false;
  message: string;
}

/**
 * How a field name resolves to queries.
 *
 * No variant produces a query STRING. That is the security property: the
 * executor is the only assembler, so escaping cannot be forgotten by a
 * descriptor author, because there is no seam through which to skip it.
 */
export type SearchStrategy =
  /** One real path. */
  | { kind: 'exact'; path: string }
  /** OR every path in one query — use when the union beats any single index. */
  | { kind: 'anyOf'; paths: string[] }
  /** Query each path in turn, stopping at the first with results. */
  | { kind: 'tiered'; paths: string[] }
  /**
   * Arbitrary clause construction, e.g. when two paths need DIFFERENT values.
   * `paths` is the exhaustive set `build` may emit; the catalog-conformance
   * guard checks it, and a unit test checks build() stays within it.
   */
  | {
      kind: 'clauses';
      paths: string[];
      build: (value: string) => ClauseSet | StrategyError;
    };

/** Every path a strategy may query. Used by the catalog-conformance guard. */
export function declaredPaths(strategy: SearchStrategy): string[] {
  return strategy.kind === 'exact' ? [strategy.path] : [...strategy.paths];
}

/**
 * The attempts to make, in order. A tiered strategy yields one set per tier;
 * every other variant yields exactly one.
 */
export function planClauseSets(
  strategy: SearchStrategy,
  value: string
): ClauseSet[] | StrategyError {
  switch (strategy.kind) {
    case 'exact':
      return [
        {
          clauses: [{ path: strategy.path, value }],
          op: 'OR',
          matched_via: strategy.path,
        },
      ];
    case 'anyOf':
      return [
        {
          clauses: strategy.paths.map((path) => ({ path, value })),
          op: 'OR',
          matched_via: `union(${strategy.paths.join(', ')})`,
        },
      ];
    case 'tiered':
      return strategy.paths.map((path) => ({
        clauses: [{ path, value }],
        op: 'OR' as const,
        matched_via: path,
      }));
    case 'clauses': {
      const built = strategy.build(value);
      return 'ok' in built ? built : [built];
    }
  }
}
