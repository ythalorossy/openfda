import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { summarizeResults, withTotals } from '../src/utils/format';
import { getDrugByGenericName } from '../src/drug/get-drug-by-generic-name';
import { stubFetch } from './helpers/stubFetch';

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

describe('list tools report the upstream total', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 3, total: 91 } },
        results: [
          { openfda: { brand_name: ['A'] } },
          { openfda: { brand_name: ['B'] } },
          { openfda: { brand_name: ['C'] } },
        ],
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('distinguishes the requested limit from the matching total', async () => {
    const result = await getDrugByGenericName.handler({
      genericName: 'citalopram',
      limit: 3,
    });

    const text = result.content[0].text;
    expect(text).toContain('Showing 3 of 91');
    expect(text).not.toContain('Found 3 drug(s)');
    expect(JSON.parse(text.slice(text.indexOf('{'))).total).toBe(91);
  });
});
