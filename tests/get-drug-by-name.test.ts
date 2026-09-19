import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { stubFetch } from './helpers/stubFetch';

const empty = { meta: { results: { skip: 0, limit: 1, total: 0 } }, results: [] };
const hit = (brand: string) => ({
  meta: { results: { skip: 0, limit: 1, total: 1 } },
  results: [{ openfda: { brand_name: [brand] } }],
});

describe('getDrugByName', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('resolves a plain brand name in a single request', async () => {
    fetchStub = stubFetch([hit('ZESTRIL')]);
    const result = await getDrugByName.handler({ drugName: 'Zestril' });
    expect(fetchStub.calls.length).toBe(1);
    expect(result.content[0].text).toContain('"matched_via": "openfda.brand_name"');
  });

  it('falls through to spl_product_data_elements for Cordarone', async () => {
    fetchStub = stubFetch([empty, empty, empty, hit('AMIODARONE HCL')]);
    const result = await getDrugByName.handler({ drugName: 'Cordarone' });
    expect(fetchStub.calls.length).toBe(4);
    expect(result.content[0].text).toContain(
      '"matched_via": "spl_product_data_elements"'
    );
  });

  it('returns suggestions, not a bare miss, when every tier fails', async () => {
    fetchStub = stubFetch([empty, empty, empty, empty]);
    const result = await getDrugByName.handler({ drugName: 'Notadrugatall' });
    expect(fetchStub.calls.length).toBe(4);
    expect(result.content[0].text).toContain('Suggestions');
    expect(result.isError).toBeUndefined();
  });

  it('still returns every promised label field, defaulting to []', async () => {
    fetchStub = stubFetch([hit('ZESTRIL')]);
    const result = await getDrugByName.handler({ drugName: 'Zestril' });
    const payload = JSON.parse(
      result.content[0].text.slice(result.content[0].text.indexOf('{'))
    );
    for (const key of [
      'boxed_warning', 'warnings', 'warnings_and_cautions', 'do_not_use',
      'ask_doctor', 'ask_doctor_or_pharmacist', 'stop_use',
      'pregnancy_or_breast_feeding', 'indications_and_usage',
    ]) {
      expect(payload).toHaveProperty(key);
    }
  });

  it('surfaces an upstream error rather than reporting not-found', async () => {
    // Use a non-retryable 4xx (400) so each of the 4 tiers makes exactly one
    // request instead of ApiHandler's internal exponential-backoff retries,
    // keeping the test fast while still exercising every tier.
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (input: any) => {
      calls.push(String(input));
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => '',
        json: async () => ({}),
      } as any;
    }) as any;

    try {
      const result = await getDrugByName.handler({ drugName: 'Zestril' });
      expect(calls.length).toBe(4);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).not.toContain('Suggestions');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
