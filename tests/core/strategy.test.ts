import { describe, it, expect } from 'vitest';
import {
  planClauseSets,
  declaredPaths,
  type SearchStrategy,
  type ClauseSet,
  type StrategyError,
} from '../../src/core/search/strategy';

/**
 * `planClauseSets` deliberately returns `ClauseSet[] | StrategyError` — a
 * clause builder must be able to reject a value before any request is made.
 * This narrows that union for the tests below that expect the non-error
 * shape, rather than casting past the type checker.
 */
function assertSets(result: ClauseSet[] | StrategyError): ClauseSet[] {
  if (!Array.isArray(result)) {
    throw new Error(`expected ClauseSet[], got StrategyError: ${result.message}`);
  }
  return result;
}

describe('planClauseSets', () => {
  it('exact yields one set naming the path as matched_via', () => {
    const strategy: SearchStrategy = { kind: 'exact', path: 'openfda.brand_name' };
    expect(planClauseSets(strategy, 'Advil')).toEqual([
      {
        clauses: [{ path: 'openfda.brand_name', value: 'Advil' }],
        op: 'OR',
        matched_via: 'openfda.brand_name',
      },
    ]);
  });

  it('anyOf yields ONE set ORing every path, because the union beats any single index', () => {
    const strategy: SearchStrategy = {
      kind: 'anyOf',
      paths: ['patient.drug.medicinalproduct', 'patient.drug.openfda.substance_name'],
    };
    const sets = assertSets(planClauseSets(strategy, 'IBUPROFEN'));
    expect(sets).toHaveLength(1);
    expect(sets[0].clauses).toHaveLength(2);
    expect(sets[0].op).toBe('OR');
    expect(sets[0].matched_via).toBe(
      'union(patient.drug.medicinalproduct, patient.drug.openfda.substance_name)'
    );
  });

  it('tiered yields one set PER TIER, in order, so the executor can stop at the first hit', () => {
    const strategy: SearchStrategy = {
      kind: 'tiered',
      paths: ['openfda.brand_name', 'openfda.generic_name'],
    };
    const sets = assertSets(planClauseSets(strategy, 'Cordarone'));
    expect(sets).toHaveLength(2);
    expect(sets[0].matched_via).toBe('openfda.brand_name');
    expect(sets[1].matched_via).toBe('openfda.generic_name');
  });

  it('clauses delegates to the builder', () => {
    const strategy: SearchStrategy = {
      kind: 'clauses',
      paths: ['openfda.product_ndc', 'openfda.package_ndc'],
      build: (value) => ({
        clauses: [
          { path: 'openfda.product_ndc', value },
          { path: 'openfda.package_ndc', value: `${value}-01` },
        ],
        op: 'OR',
        matched_via: 'openfda.product_ndc OR openfda.package_ndc',
      }),
    };
    const sets = assertSets(planClauseSets(strategy, '12345-1234'));
    expect(sets).toHaveLength(1);
    expect(sets[0].clauses[1].value).toBe('12345-1234-01');
  });

  it('propagates a builder rejection instead of querying', () => {
    const strategy: SearchStrategy = {
      kind: 'clauses',
      paths: ['openfda.product_ndc'],
      build: () => ({ ok: false, message: 'not a valid NDC' }),
    };
    expect(planClauseSets(strategy, 'nonsense')).toEqual({ ok: false, message: 'not a valid NDC' });
  });

  it('turns a builder-produced ClauseSet with zero clauses into a StrategyError', () => {
    // This is a syntactically valid ClauseSet, not a StrategyError, so
    // nothing upstream of planClauseSets would otherwise catch it before
    // buildQuery throws on an empty clause group deep inside the executor's
    // tier loop.
    const strategy: SearchStrategy = {
      kind: 'clauses',
      paths: ['openfda.product_ndc'],
      build: () => ({ clauses: [], op: 'OR', matched_via: 'openfda.product_ndc' }),
    };
    const result = planClauseSets(strategy, 'whatever');
    expect(Array.isArray(result)).toBe(false);
    expect((result as StrategyError).ok).toBe(false);
    expect((result as StrategyError).message).toContain('no clauses');
  });
});

describe('declaredPaths', () => {
  it('reports every path each variant may query', () => {
    expect(declaredPaths({ kind: 'exact', path: 'a' })).toEqual(['a']);
    expect(declaredPaths({ kind: 'anyOf', paths: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(declaredPaths({ kind: 'tiered', paths: ['a', 'b'] })).toEqual(['a', 'b']);
    expect(
      declaredPaths({ kind: 'clauses', paths: ['a', 'b'], build: () => ({ ok: false, message: 'x' }) })
    ).toEqual(['a', 'b']);
  });
});
