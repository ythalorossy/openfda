import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveLabel, RESOLUTION_TIERS, resolveGenericName } from '../src/drug/resolve-label';
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
    // Pin the request count: with all four stub responses identical, a
    // regression that gives up after tier 1 would still report
    // found: false, so the count (and per-tier field checks below) are
    // what actually prove all four tiers were walked.
    expect(fetchStub.calls.length).toBe(4);
    expect(fetchStub.calls[0]).toContain('openfda.brand_name');
    expect(fetchStub.calls[1]).toContain('openfda.generic_name');
    expect(fetchStub.calls[2]).toContain('openfda.substance_name');
    expect(fetchStub.calls[3]).toContain('spl_product_data_elements');
  });

  it('queries each tier against its own field', async () => {
    fetchStub = stubFetch([empty, hit('X')]);

    await resolveLabel('metformin');

    expect(fetchStub.calls.length).toBe(2);
    expect(fetchStub.calls[0]).toContain('openfda.brand_name');
    expect(fetchStub.calls[1]).toContain('openfda.generic_name');
  });
});

describe('resolveGenericName', () => {
  it('prefers openfda.generic_name', () => {
    expect(
      resolveGenericName({
        generic_name: ['AMIODARONE HYDROCHLORIDE'],
        substance_name: ['AMIODARONE'],
      })
    ).toBe('AMIODARONE HYDROCHLORIDE');
  });

  it('falls back to substance_name', () => {
    expect(resolveGenericName({ substance_name: ['AMIODARONE'] })).toBe(
      'AMIODARONE'
    );
  });

  it('treats an empty array as absent', () => {
    expect(
      resolveGenericName({ generic_name: [], substance_name: ['AMIODARONE'] })
    ).toBe('AMIODARONE');
  });

  it('says Unknown honestly when neither field is present', () => {
    // It does NOT mine spl_product_data_elements — that is free text and
    // extracting an ingredient from it would be guesswork.
    expect(resolveGenericName({})).toBe('Unknown');
  });
});
