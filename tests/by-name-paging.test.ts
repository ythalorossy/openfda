import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { stubFetch } from './helpers/stubFetch';

const label = (brand: string, substances: string[]) => ({
  openfda: { brand_name: [brand], substance_name: substances },
});

describe('get-drug-by-name paging', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('passes skip through to the request', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 1, limit: 1, total: 39 } },
        results: [label('JUNIOR STRENGTH ADVIL', ['IBUPROFEN'])],
      },
    ]);

    await getDrugByName.handler({ drugName: 'Advil', skip: 1 });

    expect(fetchStub.calls[0]).toContain('skip=1');
  });

  it('omits skip when not supplied', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 39 } },
        results: [label('ADVIL', ['IBUPROFEN'])],
      },
    ]);

    await getDrugByName.handler({ drugName: 'Advil' });

    expect(fetchStub.calls[0]).not.toContain('skip=');
  });

  it('returns more than one label when limit allows', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 3, total: 39 } },
        results: [
          label('ADVIL DUAL ACTION', ['IBUPROFEN', 'ACETAMINOPHEN']),
          label('JUNIOR STRENGTH ADVIL', ['IBUPROFEN']),
        ],
      },
    ]);

    const result = await getDrugByName.handler({ drugName: 'Advil', limit: 3 });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results).toHaveLength(2);
    expect(payload.total).toBe(39);
  });

  it('puts substance_name first so a combination product is obvious', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 39 } },
        results: [label('ADVIL DUAL ACTION', ['IBUPROFEN', 'ACETAMINOPHEN'])],
      },
    ]);

    const result = await getDrugByName.handler({ drugName: 'Advil' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const keys = Object.keys(payload.results[0]);

    expect(keys[0]).toBe('substance_name');
    expect(payload.results[0].substance_name).toEqual([
      'IBUPROFEN',
      'ACETAMINOPHEN',
    ]);
  });
});
