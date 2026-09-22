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

  it('treats a 404 with a non-JSON body as an error, not a miss', async () => {
    // openFDA answers a bogus dataset or endpoint path this way — verified
    // live 2026-09-20. A descriptor typo must fail loudly, not report
    // "no records found" forever.
    const stub = stubFetchResponses([
      { status: 404, text: '<html><body>Not Found</body></html>' },
    ]);
    restore = stub.restore;
    const outcome = await fetchPage(request);
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') expect(outcome.error.status).toBe(404);
  });

  it('treats a 404 with valid JSON but a different error.code as an error', async () => {
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'SOME_OTHER_CODE', message: 'x' } } },
    ]);
    restore = stub.restore;
    expect((await fetchPage(request)).kind).toBe('error');
  });

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

  it('classifies an illegal_argument_exception 500 as a bad request, not an outage', async () => {
    // openFDA's verbatim answer to `count=<text-mapped field>`, verified
    // live 2026-09-21. Reported as an outage, it sends a caller to look at
    // openFDA's status page for a defect in their own argument.
    const details =
      '[illegal_argument_exception] Text fields are not optimised for operations that ' +
      'require per-document field data like aggregations and sorting, so these operations ' +
      'are disabled by default. Please use a keyword field instead.';
    const stub = stubFetchResponses([
      {
        status: 500,
        body: { error: { code: 'SERVER_ERROR', message: 'Check your request and try again', details } },
      },
    ]);
    restore = stub.restore;
    const outcome = await fetchPage(request);
    expect(outcome.kind).toBe('bad_request');
    if (outcome.kind === 'bad_request') {
      expect(outcome.detail).toContain('keyword field');
    }
  }, 20000);

  it('classifies a 404 "Nothing to count" as a bad request, not a miss', async () => {
    // The second way openFDA rejects an aggregation path. isNoMatches sees
    // NOT_FOUND and calls it a miss, so this presented as "no records
    // found" for a drug that has records — a phantom empty dataset.
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Nothing to count' } } },
    ]);
    restore = stub.restore;
    const outcome = await fetchPage({ ...request, count: 'sponsor_name.exact' });
    expect(outcome.kind).toBe('bad_request');
    if (outcome.kind === 'bad_request') {
      expect(outcome.detail).toContain('Nothing to count');
    }
  });

  it('keeps a zero-match 404 a MISS even when counting', async () => {
    // The negative case that makes the discriminator safe: openFDA says
    // "No matches found!" for an empty result set whether or not count is
    // set. Misreading this as a bad request would turn every legitimately
    // empty aggregation into an error.
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No matches found!' } } },
    ]);
    restore = stub.restore;
    expect((await fetchPage({ ...request, count: 'openfda.route.exact' })).kind).toBe('miss');
  });
});
