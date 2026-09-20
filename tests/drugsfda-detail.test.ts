import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugsfda, MAX_SUBMISSIONS_PER_RECORD } from '../src/drug/get-drugsfda';
import { stubFetch } from './helpers/stubFetch';

const bigRecord = {
  application_number: 'NDA020235',
  sponsor_name: 'PARKE DAVIS',
  openfda: { brand_name: ['NEURONTIN'], route: ['ORAL'] },
  products: [
    { product_number: '001', dosage_form: 'CAPSULE', route: 'ORAL', te_code: 'AB' },
    { product_number: '002', dosage_form: 'TABLET', route: 'ORAL' }, // no te_code
  ],
  submissions: Array.from({ length: 38 }, (_, i) => ({
    submission_number: String(i + 1),
    submission_status: 'AP',
    application_docs: [{ id: String(i), url: 'http://example/' + i, type: 'Label' }],
  })),
};

describe('get-drugsfda output size', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      { meta: { results: { skip: 0, limit: 5, total: 3 } }, results: [bigRecord] },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('defaults to summary: no submissions array, but a submission count', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const rec = payload.results[0];

    expect(rec.submissions).toBeUndefined();
    expect(rec.submission_count).toBe(38);
    expect(rec.application_number).toBe('NDA020235');
    expect(rec.sponsor_name).toBe('PARKE DAVIS');
    expect(Array.isArray(rec.products)).toBe(true);
  });

  it('keeps the summary response far below the size that broke the budget', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });

    // The real Neurontin response was 71,393 characters at this same limit.
    expect(result.content[0].text.length).toBeLessThan(5000);
  });

  it('caps submissions in full mode and says how many were omitted', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
      detail: 'full',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const rec = payload.results[0];

    expect(rec.submissions).toHaveLength(MAX_SUBMISSIONS_PER_RECORD);
    expect(rec.submission_count).toBe(38);
    expect(rec.submissions_truncated).toBe(true);
  });

  it('emits te_code on every product record, null when absent', async () => {
    const result = await getDrugsfda.handler({
      sectionName: 'openfda',
      fieldName: 'brand_name',
      searchValue: 'Neurontin',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const product of payload.results[0].products) {
      expect(Object.prototype.hasOwnProperty.call(product, 'te_code')).toBe(true);
    }
    expect(payload.results[0].products[0].te_code).toBe('AB');
    expect(payload.results[0].products[1].te_code).toBeNull();
  });
});
