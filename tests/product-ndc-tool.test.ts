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

  it('reaches the API for a 4-4 product NDC such as Celexa 0456-4020', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: '0456-4020' });

    expect(fetchStub.calls.length).toBe(1);
    expect(result.isError).toBeUndefined();
    expect(fetchStub.calls[0]).toContain('0456-4020');
  });

  it('rejects genuine garbage without making a request', async () => {
    const result = await getDrugByProductNdc.handler({ productNDC: 'nope' });

    expect(result.isError).toBe(true);
    expect(fetchStub.calls.length).toBe(0);
  });

  it('echoes undashed input back as the normalized, dashed product NDC', async () => {
    // 9 digits is read as 5-4. (8-digit undashed is deliberately rejected as
    // ambiguous — see the ambiguity test below.)
    const result = await getDrugByProductNdc.handler({ productNDC: '123451234' });

    const text = result.content[0].text;
    expect(text).toContain('"product_ndc": "12345-1234"');
    expect(text).not.toContain('"product_ndc": "123451234"');
    // The normalized value should also be what the surrounding prose reports,
    // consistent with the packages listed alongside it.
    expect(text).toContain('Product NDC "12345-1234" found');
  });

  it('rejects ambiguous undashed 8- and 10-digit input without a request', async () => {
    for (const ambiguous of ['58151155', '1234512340']) {
      fetchStub.calls.length = 0;
      const result = await getDrugByProductNdc.handler({ productNDC: ambiguous });

      expect(result.isError, `${ambiguous} should be rejected`).toBe(true);
      expect(result.content[0].text).toContain('ambiguous');
      expect(fetchStub.calls.length, `${ambiguous} must not hit the API`).toBe(0);
    }
  });
});
