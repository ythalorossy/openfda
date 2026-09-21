import { describe, it, expect } from 'vitest';
import { applyProjection, capArray } from '../../src/core/shape/project';

describe('capArray', () => {
  it('reports truncation only when it actually dropped something', () => {
    expect(capArray([1, 2, 3], 10)).toEqual({ rows: [1, 2, 3], truncated: false });
    expect(capArray([1, 2, 3], 2)).toEqual({ rows: [1, 2], truncated: true });
  });

  it('treats a missing array as empty rather than throwing', () => {
    expect(capArray(undefined, 5)).toEqual({ rows: [], truncated: false });
  });
});

describe('applyProjection', () => {
  it('maps every record through the projection function', () => {
    const projection = {
      name: 'summary',
      description: 'x',
      returnsFields: ['id'] as const,
      project: (record: any) => ({ id: record.safetyreportid ?? null }),
    };
    expect(applyProjection(projection, [{ safetyreportid: '7' }, {}])).toEqual([
      { id: '7' },
      { id: null },
    ]);
  });
});
