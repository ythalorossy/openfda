import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugAdverseEventCounts } from '../src/drug/get-drug-adverse-event-counts';
import { stubFetch } from './helpers/stubFetch';

const countResponse = {
  meta: { disclaimer: 'x' },
  results: [
    { term: 'FATIGUE', count: 9480 },
    { term: 'NAUSEA', count: 8715 },
    { term: 'HEADACHE', count: 5001 },
  ],
};

describe('get-drug-adverse-event-counts', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([countResponse]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  it('aggregates by reaction term by default', async () => {
    await getDrugAdverseEventCounts.handler({ drugName: 'citalopram' });

    expect(fetchStub.calls[0]).toContain(
      'count=patient.reaction.reactionmeddrapt.exact'
    );
  });

  it('searches the same three indexes as the records tool', async () => {
    await getDrugAdverseEventCounts.handler({ drugName: 'citalopram' });

    const url = fetchStub.calls[0];
    expect(url).toContain('openfda.generic_name');
    expect(url).toContain('openfda.substance_name');
    expect(url).toContain('medicinalproduct');
    expect(url).toContain('+OR+');
  });

  it('returns ranked terms with counts', async () => {
    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({
      term: 'FATIGUE',
      term_code: 'FATIGUE',
      count: 9480,
    });
    expect(payload.results).toHaveLength(3);
  });

  it('states that a count response carries no result total', async () => {
    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
    });

    // openFDA omits meta.results.total on count responses. Saying so keeps
    // the absence from looking like the missing-totals bug fixed in 1.1.0.
    expect(result.content[0].text.toLowerCase()).toContain('no result total');
  });

  it('honours an explicit field and limit', async () => {
    await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
      field: 'occurcountry.exact',
      limit: 5,
    });

    expect(fetchStub.calls[0]).toContain('count=occurcountry.exact');
    expect(fetchStub.calls[0]).toContain('limit=5');
  });

  it('returns a clear message when nothing matches', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([{ meta: {}, results: [] }]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'notadrug',
    });

    expect(result.content[0].text).toContain('No adverse event counts');
    expect(result.isError).toBeUndefined();
  });

  it('decodes coded terms and keeps the raw code alongside', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: {},
        // openFDA sends these as numbers, not strings.
        results: [
          { term: 1, count: 370930 },
          { term: 2, count: 135235 },
        ],
      },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'serious',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({
      term: 'Serious',
      term_code: 1,
      count: 370930,
    });
    expect(payload.results[1].term).toBe('Not serious');
  });

  it('decodes patient sex', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      { meta: {}, results: [{ term: 2, count: 284037 }, { term: 0, count: 2150 }] },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'patient.patientsex',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0].term).toBe('Female');
    expect(payload.results[1].term).toBe('Unknown');
  });

  it('leaves text fields untouched', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      { meta: {}, results: [{ term: 'DRUG INEFFECTIVE', count: 9480 }] },
    ]);

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'prednisone',
      field: 'patient.reaction.reactionmeddrapt.exact',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    expect(payload.results[0]).toEqual({
      term: 'DRUG INEFFECTIVE',
      term_code: 'DRUG INEFFECTIVE',
      count: 9480,
    });
  });
});
