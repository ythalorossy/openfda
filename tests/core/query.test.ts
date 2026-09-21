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

  it('rejects a clause path that is not a plain dotted identifier', () => {
    // path is interpolated raw, unlike value, so it is checked against a
    // closed shape here rather than trusted from every call site. This path
    // carries a colon, a space and a quote all at once — exactly the shape
    // that would splice a second clause into the query.
    expect(() =>
      buildQuery({ clauses: [{ path: 'a:"x" OR b', value: 'Advil' }], op: 'OR', matched_via: 'x' })
    ).toThrow(/a:"x" OR b/);
  });

  it('accepts a legitimate .exact path, so the path guard rejects nothing real', () => {
    expect(
      buildQuery({
        clauses: [{ path: 'openfda.brand_name.exact', value: 'Advil' }],
        op: 'OR',
        matched_via: 'x',
      })
    ).toBe('openfda.brand_name.exact:"Advil"');
  });

  it('refuses an empty clause group instead of silently building an unfiltered query', () => {
    expect(() => buildQuery({ clauses: [], op: 'OR', matched_via: 'union()' })).toThrow(
      /empty/i
    );
  });
});
