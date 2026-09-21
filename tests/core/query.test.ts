import { describe, it, expect } from 'vitest';
import { buildQuery } from '../../src/core/search/query';

describe('buildQuery', () => {
  it('renders a single clause as a quoted phrase term', () => {
    expect(
      buildQuery({ clauses: [{ path: 'openfda.brand_name', value: 'Advil' }], op: 'OR', matched_via: 'x' })
    ).toBe('openfda.brand_name:"Advil"');
  });

  it('joins clauses with the set operator', () => {
    expect(
      buildQuery({
        clauses: [
          { path: 'a', value: 'x' },
          { path: 'b', value: 'x' },
        ],
        op: 'OR',
        matched_via: 'x',
      })
    ).toBe('a:"x" OR b:"x"');
  });

  it('PARENTHESISES the group before ANDing a filter', () => {
    // Without the parentheses `a OR b AND serious:"1"` binds the AND to b
    // only, silently filtering one index instead of all of them. This was
    // fixed by hand in get-drug-adverse-events; here it is structural.
    expect(
      buildQuery(
        {
          clauses: [
            { path: 'a', value: 'x' },
            { path: 'b', value: 'x' },
          ],
          op: 'OR',
          matched_via: 'x',
        },
        [{ path: 'serious', value: '1' }]
      )
    ).toBe('(a:"x" OR b:"x") AND serious:"1"');
  });

  it('ANDs multiple filters together', () => {
    expect(
      buildQuery({ clauses: [{ path: 'a', value: 'x' }], op: 'OR', matched_via: 'x' }, [
        { path: 'serious', value: '1' },
        { path: 'occurcountry', value: 'US' },
      ])
    ).toBe('(a:"x") AND serious:"1" AND occurcountry:"US"');
  });

  it('escapes every value it emits, in the group and in the filters', () => {
    expect(
      buildQuery({ clauses: [{ path: 'a', value: 'x" OR b:"y' }], op: 'OR', matched_via: 'x' }, [
        { path: 'f', value: 'q"' },
      ])
    ).toBe('(a:"x\\" OR b:\\"y") AND f:"q\\""');
  });
});
