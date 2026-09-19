import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByNdc } from '../src/drug/get-drug-by-ndc';
import { stubFetch } from './helpers/stubFetch';

describe('get-drug-by-ndc query encoding', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([{ results: [] }]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('sends the product/package OR filter as +OR+ and never as %2BOR%2B', async () => {
    // 11-digit input yields both a productNDC and a packageNDC.
    await getDrugByNdc.handler({ ndcCode: '12345123401' });

    expect(fetchStub.calls[0]).toContain('+OR+');
    expect(fetchStub.calls[0]).not.toContain('%2BOR%2B');
  });
});
