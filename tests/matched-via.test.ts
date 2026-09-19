import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsByManufacturer } from '../src/drug/get-drugs-by-manufacturer';
import { getDrugByNdc } from '../src/drug/get-drug-by-ndc';
import { stubFetch } from './helpers/stubFetch';

describe('matched_via is reported by every search tool', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  it('get-drugs-by-manufacturer names the field it searched', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 20, total: 397 } },
        results: [{ openfda: { brand_name: ['A'] } }],
      },
    ]);

    const result = await getDrugsByManufacturer.handler({
      manufacturerName: 'American Health Packaging',
      limit: 20,
    });

    expect(result.content[0].text).toContain(
      '"matched_via": "openfda.manufacturer_name"'
    );
  });

  it('get-drug-by-ndc names the NDC field it searched', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 10, total: 1 } },
        results: [
          { openfda: { brand_name: ['LIPITOR'], package_ndc: ['58151-155-01'] } },
        ],
      },
    ]);

    const result = await getDrugByNdc.handler({ ndcCode: '58151-155' });

    expect(result.content[0].text).toContain('"matched_via"');
    expect(result.content[0].text).toContain('product_ndc');
  });

  it('get-drug-by-ndc reports OR when input includes package segment', async () => {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 10, total: 1 } },
        results: [
          { openfda: { brand_name: ['LIPITOR'], package_ndc: ['12345-1234-01'] } },
        ],
      },
    ]);

    const result = await getDrugByNdc.handler({ ndcCode: '12345-1234-01' });

    expect(result.content[0].text).toContain(
      '"matched_via": "openfda.product_ndc OR openfda.package_ndc"'
    );
  });
});
