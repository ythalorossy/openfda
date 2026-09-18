import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc';
import { stubFetch } from './helpers/stubFetch';

describe('get-drug-by-product-ndc', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            openfda: {
              brand_name: ['LIPITOR'],
              package_ndc: ['58151-155-01'],
            },
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('reaches the API for a 5-3 product NDC instead of rejecting it', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: '58151-155' });

    expect(fetchStub.calls.length).toBe(1);
    expect(result.isError).toBeUndefined();
  });

  it('rejects genuine garbage without making a request', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: 'nope' });

    expect(result.isError).toBe(true);
    expect(fetchStub.calls.length).toBe(0);
  });

  it('echoes undashed input back as the normalized, dashed product NDC', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: '58151155' });

    const text = result.content[0].text;
    expect(text).toContain('"product_ndc": "58151-155"');
    expect(text).not.toContain('"product_ndc": "58151155"');
    // The normalized value should also be what the surrounding prose reports,
    // consistent with the packages listed alongside it.
    expect(text).toContain('Product NDC "58151-155" found');
  });
});
