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

  it('queries all three FAERS indexes, ORed', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });

    const url = fetchStub.calls[0];
    expect(url).toContain('openfda.generic_name');
    expect(url).toContain('openfda.substance_name');
    expect(url).toContain('medicinalproduct');
    expect(url).toContain('+OR+');
    expect(url).not.toContain('%2BOR%2B');
  });

  it('parenthesises the OR group when filtering by seriousness', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'serious',
    });

    // URLSearchParams encodes spaces as literal `+`, and decodeURIComponent
    // does not turn `+` back into a space (that's form-decoding, not URI
    // decoding), so normalize `+` to space before decoding percent-escapes.
    const url = decodeURIComponent(fetchStub.calls[0].replace(/\+/g, ' '));
    // The AND must bind to the whole disjunction, not just the last term.
    expect(url).toContain('(patient.drug.openfda.generic_name');
    expect(url).toContain(') AND serious:1');
  });

  it('reports the union total, not the single-field total', async () => {
    // Recorded from the live API: medicinalproduct alone gives 113,881;
    // the union of all three indexes gives 143,346. A regression that
    // narrowed the search would show up here as a smaller number.
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 143346 } },
        results: [{ safetyreportid: '1', patient: { reaction: [] } }],
      },
    ]);

    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });
    const text = result.content[0].text;

    expect(text).toContain('143346');
    expect(text).not.toContain('113881');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.total).toBe(143346);
    expect(payload.matched_via).toContain('union');
  });

  it('passes skip and sort through to the request', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
      skip: 20,
      sort: 'receivedate:desc',
    });

    const url = fetchStub.calls[0];
    expect(url).toContain('skip=20');
    expect(url).toContain('sort=receivedate%3Adesc');
  });

  it('rejects skip above the openFDA ceiling without making a request', async () => {
    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
      skip: 25001,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('25000');
    expect(fetchStub.calls.length).toBe(0);
  });

  it('omits skip and sort when not supplied', async () => {
    await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 1,
      seriousness: 'all',
    });

    expect(fetchStub.calls[0]).not.toContain('skip=');
    expect(fetchStub.calls[0]).not.toContain('sort=');
  });

  it('reports the offset in the header and payload when skip is set, so paged results do not look identical', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 20, limit: 10, total: 143346 } },
        results: [{ safetyreportid: '21', patient: { reaction: [] } }],
      },
    ]);

    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 10,
      skip: 20,
    });
    const text = result.content[0].text;

    expect(text).toContain('offset 20');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.skip).toBe(20);
  });

  it('omits the offset from the header and payload when skip is not set', async () => {
    fetchStub.restore();
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 10, total: 143346 } },
        results: [{ safetyreportid: '1', patient: { reaction: [] } }],
      },
    ]);

    const result = await getDrugAdverseEvents.handler({
      drugName: 'citalopram',
      limit: 10,
    });
    const text = result.content[0].text;

    expect(text).not.toContain('offset');
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    expect(payload.skip).toBeUndefined();
  });
});
