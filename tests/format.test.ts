import { describe, it, expect } from 'vitest';
import { summarizeResults, withTotals } from '../src/utils/format';

describe('summarizeResults', () => {
  it('reports the total alongside the returned count', () => {
    expect(summarizeResults(3, 91, 'matching labels')).toBe(
      'Showing 3 of 91 matching labels'
    );
  });

  it('does not imply a total it does not have', () => {
    expect(summarizeResults(3, undefined, 'matching labels')).toBe(
      'Showing 3 matching labels (total unknown)'
    );
  });

  it('states plainly when everything is shown', () => {
    expect(summarizeResults(2, 2, 'matching labels')).toBe(
      'Showing all 2 matching labels'
    );
  });
});

describe('withTotals', () => {
  it('carries the total in the structured payload, not only the prose', () => {
    expect(withTotals(['a', 'b'], 91, 10)).toEqual({
      total: 91,
      returned: 2,
      limit: 10,
      results: ['a', 'b'],
    });
  });

  it('uses null rather than inventing a total when it is unknown', () => {
    expect(withTotals(['a'], undefined, 10).total).toBeNull();
  });
});
