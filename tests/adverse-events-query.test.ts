import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { stubFetch } from './helpers/stubFetch';

describe('get-drug-adverse-events query encoding', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      { meta: { results: { skip: 0, limit: 1, total: 42 } }, results: [] },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('sends the seriousness filter as +AND+ and never as %2BAND%2B', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'metformin',
      limit: 1,
      seriousness: 'serious',
    });

    expect(fetchStub.calls[0]).toContain('+AND+serious%3A1');
    expect(fetchStub.calls[0]).not.toContain('%2BAND%2B');
  });

  it('omits the filter entirely for seriousness=all', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'metformin',
      limit: 1,
      seriousness: 'all',
    });

    expect(fetchStub.calls[0]).not.toContain('serious%3A');
  });
});
