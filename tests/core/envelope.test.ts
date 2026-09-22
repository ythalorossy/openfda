import { describe, it, expect } from 'vitest';
import { buildEnvelope } from '../../src/core/shape/envelope';
import { SKIP_MAX } from '../../src/core/paging';

describe('buildEnvelope', () => {
  it('reports the upstream total, not the caller limit', () => {
    const envelope = buildEnvelope('openfda.brand_name', [{ a: 1 }], 214, 5);
    expect(envelope).toEqual({
      matched_via: 'openfda.brand_name',
      total: 214,
      returned: 1,
      limit: 5,
      dropped_for_budget: 0,
      next_skip: 1,
      results: [{ a: 1 }],
    });
  });

  it('uses null, not a guess, when openFDA omits a total', () => {
    expect(buildEnvelope('x', [], undefined, 5).total).toBeNull();
  });

  it('includes skip only when the caller supplied it, so paged responses stay distinguishable', () => {
    expect('skip' in buildEnvelope('x', [], 1, 5)).toBe(false);
    expect(buildEnvelope('x', [], 1, 5, 20).skip).toBe(20);
  });

  it('tells the caller where to continue, so paging does not step over dropped rows', () => {
    // skip += limit is the obvious idiom and it is wrong: the budget drops
    // trailing rows, so advancing by limit steps over exactly the rows that
    // were dropped. Advancing by returned is correct, and next_skip is that
    // arithmetic done once, here.
    const envelope = buildEnvelope('product_description', [{ a: 1 }], 138, 50, 0, 11);
    expect(envelope.returned).toBe(1);
    expect(envelope.dropped_for_budget).toBe(11);
    expect(envelope.next_skip).toBe(1);
  });

  it('reports dropped_for_budget as 0 rather than omitting it', () => {
    // A key that appears only sometimes is a key a consumer has to guess
    // about.
    expect(buildEnvelope('x', [{ a: 1 }], 10, 5).dropped_for_budget).toBe(0);
  });

  it('nulls next_skip when the result set is exhausted', () => {
    expect(buildEnvelope('x', [{ a: 1 }, { b: 2 }], 2, 5).next_skip).toBeNull();
    expect(buildEnvelope('x', [{ a: 1 }], 3, 5, 2).next_skip).toBeNull();
  });

  it('nulls next_skip rather than handing back an offset the tool would reject', () => {
    // SKIP_MAX is openFDA's own ceiling and execute() rejects anything above
    // it. Returning such an offset would be the same class of defect as
    // returning one that skips records.
    const envelope = buildEnvelope('x', [{ a: 1 }], 1_000_000, 5, SKIP_MAX);
    expect(envelope.next_skip).toBeNull();
  });

  it('still advances when openFDA reports no total', () => {
    // total is null on an aggregation and could be absent on a record page;
    // without it, exhaustion is unknowable, so offering the next offset is
    // more useful than refusing to.
    expect(buildEnvelope('x', [{ a: 1 }], undefined, 5, 10).next_skip).toBe(11);
  });
});
