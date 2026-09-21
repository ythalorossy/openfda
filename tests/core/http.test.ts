import { describe, it, expect, afterEach } from 'vitest';
import { fetchPage } from '../../src/core/http';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const request = {
  dataset: 'drug',
  endpoint: 'label',
  search: 'openfda.brand_name:"Advil"',
  limit: 1,
};

describe('fetchPage', () => {
  it('reports a hit and hands back the parsed body', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 39 } }, results: [{ id: 1 }] } },
    ]);
    restore = stub.restore;
    const outcome = await fetchPage<any>(request);
    expect(outcome.kind).toBe('hit');
    if (outcome.kind === 'hit') expect(outcome.data.meta.results.total).toBe(39);
  });

  it('treats HTTP 404 NOT_FOUND as a MISS, not an error', async () => {
    // This is how openFDA reports zero matches. Calling it an error is the
    // defect that made every 1.x not-found message unreachable.
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No matches found!' } } },
    ]);
    restore = stub.restore;
    expect((await fetchPage(request)).kind).toBe('miss');
  });

  it('treats a 200 with an empty results array as a miss', async () => {
    const stub = stubFetchResponses([{ body: { meta: {}, results: [] } }]);
    restore = stub.restore;
    expect((await fetchPage(request)).kind).toBe('miss');
  });

  it('reports a genuine upstream failure as an error', async () => {
    const stub = stubFetchResponses([{ status: 500, body: { error: { code: 'SERVER' } } }]);
    restore = stub.restore;
    const outcome = await fetchPage(request);
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') expect(outcome.error.status).toBe(500);
  }, 20000);

  it('passes skip, sort and count through to the URL', async () => {
    const stub = stubFetchResponses([{ body: { results: [{ term: 'NAUSEA', count: 3 }] } }]);
    restore = stub.restore;
    await fetchPage({
      ...request,
      endpoint: 'event',
      skip: 20,
      sort: 'receivedate:desc',
      count: 'patient.reaction.reactionmeddrapt.exact',
    });
    expect(stub.calls[0]).toContain('skip=20');
    expect(stub.calls[0]).toContain('sort=receivedate%3Adesc');
    expect(stub.calls[0]).toContain('count=patient.reaction.reactionmeddrapt.exact');
  });
});
