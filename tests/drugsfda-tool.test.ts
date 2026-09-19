import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsfda } from '../src/drug/get-drugsfda';
import { stubFetch } from './helpers/stubFetch';

const hit = (total: number, n: number) => ({
  meta: { results: { skip: 0, limit: n, total } },
  results: Array.from({ length: n }, (_, i) => ({
    application_number: `NDA00000${i}`,
    sponsor_name: 'UPJOHN',
  })),
});

describe('get-drugsfda', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([hit(14813, 5)]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('returns more than one record and reports the real total', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'marketing_status',
      searchValue: 'Discontinued',
    });
    const text = result.content[0].text;

    expect(text).toContain('Showing 5 of 14813');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.total).toBe(14813);
    expect(payload.results).toHaveLength(5);
  });

  it('emits application fields with no prefix', async () => {
    await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'application_number',
      searchValue: 'NDA020702',
    });

    const url = decodeURIComponent(fetchStub.calls[0]);
    expect(url).toContain('search=application_number:"NDA020702"');
    expect(url).not.toContain('application.application_number');
  });

  it('nests application_docs under submissions', async () => {
    await getDrugsfda.handler({
      sectionName: 'application_docs',
      fieldName: 'type',
      searchValue: 'Label',
    });

    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'submissions.application_docs.type:"Label"'
    );
  });

  it('upper-cases sponsor_name but not brand_name', async () => {
    await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'sponsor_name',
      searchValue: 'Upjohn',
    });
    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'sponsor_name:"UPJOHN"'
    );

    fetchStub.restore();
    fetchStub = stubFetch([hit(1, 1)]);
    await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Lipitor',
    });
    expect(decodeURIComponent(fetchStub.calls[0])).toContain(
      'openfda.brand_name:"Lipitor"'
    );
  });

  it('rejects an invalid section distinguishably from no-results, with no request', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'bogus',
      fieldName: 'brand_name',
      searchValue: 'Lipitor',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown section');
    expect(result.content[0].text).not.toContain('No results');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('rejects an invalid field for a valid section, with no request', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'not_a_field',
      searchValue: 'x',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown field');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('honours an explicit limit', async () => {
    await getDrugsfda.handler({
      sectionName: 'products',
      fieldName: 'marketing_status',
      searchValue: 'Discontinued',
      limit: 20,
    });

    expect(fetchStub.calls[0]).toContain('limit=20');
  });
});
