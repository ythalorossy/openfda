import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveLabel, RESOLUTION_TIERS } from '../src/drug/resolve-label';
import { stubFetch } from './helpers/stubFetch';

const empty = { meta: { results: { skip: 0, limit: 1, total: 0 } }, results: [] };
const hit = (brand: string) => ({
  meta: { results: { skip: 0, limit: 1, total: 1 } },
  results: [{ openfda: { brand_name: [brand] } }],
});

describe('resolveLabel', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('tries the tiers in the documented order', () => {
    expect(RESOLUTION_TIERS).toEqual([
      'openfda.brand_name',
      'openfda.generic_name',
      'openfda.substance_name',
      'spl_product_data_elements',
    ]);
  });

  it('stops at the first tier and makes exactly one request on a brand hit', async () => {
    fetchStub = stubFetch([hit('ZESTRIL')]);

    const result = await resolveLabel('Zestril');

    expect(result.found).toBe(true);
    expect(result).toHaveProperty('matched_via', 'openfda.brand_name');
    expect(fetchStub.calls.length).toBe(1);
  });

  it('falls through to spl_product_data_elements for Cordarone', async () => {
    fetchStub = stubFetch([empty, empty, empty, hit('AMIODARONE HCL')]);

    const result = await resolveLabel('Cordarone');

    expect(result.found).toBe(true);
    expect(result).toHaveProperty('matched_via', 'spl_product_data_elements');
    expect(fetchStub.calls.length).toBe(4);
  });

  it('reports not found once every tier misses', async () => {
    fetchStub = stubFetch([empty, empty, empty, empty]);

    const result = await resolveLabel('Notadrugatall');

    expect(result.found).toBe(false);
  });

  it('queries each tier against its own field', async () => {
    fetchStub = stubFetch([empty, hit('X')]);

    await resolveLabel('metformin');

    expect(fetchStub.calls[0]).toContain('openfda.brand_name');
    expect(fetchStub.calls[1]).toContain('openfda.generic_name');
  });
});
