import { describe, it, expect } from 'vitest';
import { buildEnvelope } from '../../src/core/shape/envelope';

describe('buildEnvelope', () => {
  it('reports the upstream total, not the caller limit', () => {
    const envelope = buildEnvelope('openfda.brand_name', [{ a: 1 }], 214, 5);
    expect(envelope).toEqual({
      matched_via: 'openfda.brand_name',
      total: 214,
      returned: 1,
      limit: 5,
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
});
