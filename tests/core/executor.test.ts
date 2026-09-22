import { describe, it, expect, afterEach } from 'vitest';
import { execute } from '../../src/core/executor';
import type { EndpointDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const NOT_FOUND = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'No matches found!' } } };

const descriptor = (): EndpointDescriptor => ({
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary: 'Search drug labels.',
  fields: [
    {
      name: 'drug_name',
      description: 'Brand, generic or substance name.',
      strategy: { kind: 'tiered', paths: ['openfda.brand_name', 'openfda.generic_name'] },
    },
    {
      name: 'sponsor',
      description: 'Sponsor, stored uppercase.',
      uppercase: true,
      strategy: { kind: 'exact', path: 'sponsor_name' },
    },
    {
      name: 'bad_ndc',
      description: 'Rejects bad input before querying.',
      normalize: (raw) =>
        raw === 'ok' ? { ok: true, value: '12345-1234' } : { ok: false, message: 'not a valid NDC' },
      strategy: { kind: 'exact', path: 'openfda.product_ndc' },
    },
    {
      name: 'empty_clauses',
      description: 'A clauses builder that forgets to emit any clause.',
      strategy: {
        kind: 'clauses',
        paths: ['openfda.product_ndc'],
        build: () => ({ clauses: [], op: 'OR', matched_via: 'openfda.product_ndc' }),
      },
    },
    {
      name: 'unsafe_path',
      description: 'A clauses builder that emits a path buildQuery must reject.',
      strategy: {
        kind: 'clauses',
        paths: ['openfda.product_ndc'],
        build: (value) => ({
          clauses: [{ path: 'not a safe path!', value }],
          op: 'OR',
          matched_via: 'openfda.product_ndc',
        }),
      },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description: 'Identity fields.',
      returnsFields: ['brand_name'],
      project: (record: any) => ({ brand_name: record?.openfda?.brand_name ?? [] }),
    },
    {
      name: 'full',
      description: 'Everything.',
      returnsFields: ['raw'],
      project: (record: any) => ({ raw: record }),
    },
  ],
  extraFilters: {
    schema: {},
    toClauses: (input) =>
      input.seriousness === 'serious' ? [{ path: 'serious', value: '1' }] : [],
  },
  sortFields: ['receivedate:desc'],
  countFields: ['openfda.route', 'serious'],
  codeMaps: { serious: { '1': 'Serious', '2': 'Not serious' } },
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
});

const textOf = (result: { content: { text: string }[] }) => result.content[0]!.text;

describe('execute: input validation happens before any request', () => {
  it('rejects an unknown field and lists the valid ones', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'nope', value: 'Advil' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('drug_name');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects an empty value', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: '   ' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects a normalize failure with the normalizer message', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'bad_ndc', value: 'junk' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('not a valid NDC');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects skip above openFDA ceiling locally rather than forwarding it', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', skip: 25001 });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('25000');
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects a count field the endpoint cannot aggregate', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'not_countable' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });

  it('rejects a clauses builder that produces no clauses, before any request', async () => {
    // planClauseSets must catch this itself: a syntactically valid but
    // empty ClauseSet is not a StrategyError, so nothing upstream of it
    // would otherwise notice before buildQuery throws mid-loop.
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'empty_clauses', value: 'x' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('no clauses');
    expect(stub.calls).toHaveLength(0);
  });
});

describe('execute: search behaviour', () => {
  it('uppercases a value when the field says the data is stored uppercase', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { field: 'sponsor', value: 'Pfizer' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('sponsor_name:"PFIZER"');
  });

  it('escapes the value, so an injected clause cannot reach openFDA', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil" OR openfda.brand_name:"Tylenol' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('\\"');
  });

  it('stops a tiered search at the first tier with results', async () => {
    const stub = stubFetchResponses([
      NOT_FOUND,
      { body: { meta: { results: { total: 2 } }, results: [{ openfda: { brand_name: ['X'] } }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Cordarone' });
    expect(stub.calls).toHaveLength(2);
    expect(textOf(result)).toContain('"matched_via": "openfda.generic_name"');
  });

  it('reports no results — not an error — when every tier misses', async () => {
    const stub = stubFetchResponses([NOT_FOUND, NOT_FOUND]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Zzz' });
    expect(result.isError).toBeUndefined();
    expect(textOf(result)).toContain('No drug-label records found');
    expect(textOf(result)).toContain('openfda.brand_name');
  });

  it('reports an upstream error when a tier failed and nothing matched', async () => {
    // fetchPage retries a 500 (ApiHandler's DEFAULT_CONFIG: maxRetries 3), and
    // each retry consumes the next stubbed response, so tier one's own retry
    // attempts must all stay 500 or the retry would land on the NOT_FOUND
    // meant for tier two and misclassify tier one as a miss instead of an
    // error.
    const stub = stubFetchResponses([
      { status: 500, body: {} },
      { status: 500, body: {} },
      { status: 500, body: {} },
      { status: 500, body: {} },
      NOT_FOUND,
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Zzz' });
    expect(result.isError).toBe(true);
  }, 20000);

  it('parenthesises the clause group before ANDing an extra filter', async () => {
    const stub = stubFetchResponses([{ body: { meta: { results: { total: 1 } }, results: [{}] } }]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil', seriousness: 'serious' });
    // URLSearchParams encodes spaces as literal `+`, and decodeURIComponent
    // does not turn `+` back into a space (see adverse-events-query.test.ts).
    const url = decodeURIComponent(stub.calls[0]!.replace(/\+/g, ' '));
    expect(url).toContain('(openfda.brand_name:"Advil") AND serious:"1"');
  });

  it('catches buildQuery throwing on an unsafe path and reports it as a descriptor defect, not a crash', async () => {
    // A clauses builder decides its clause's path at runtime, so it can
    // emit one buildQuery's SAFE_PATH guard rejects even though the
    // ClauseSet it returns is non-empty and so passes planClauseSets. The
    // executor must not let that throw escape as an unhandled rejection.
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { field: 'unsafe_path', value: 'x' });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('descriptor');
    expect(stub.calls).toHaveLength(0);
  });

  it('reports a rejected argument as a bad request, not an upstream outage', async () => {
    const details =
      '[illegal_argument_exception] Text fields are not optimised for operations that ' +
      'require per-document field data like aggregations and sorting. Please use a ' +
      'keyword field instead.';
    const stub = stubFetchResponses([
      { status: 500, body: { error: { code: 'SERVER_ERROR', message: 'Check your request and try again', details } } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'openfda.route' });

    expect(result.isError).toBe(true);
    const text = result.content[0]!.text;
    // The actionable upstream sentence must reach the caller.
    expect(text).toContain('keyword field');
    // And it must not read as an outage.
    expect(text).not.toContain('experiencing issues');
  }, 20000);

  it('returns on a bad request without issuing a second tier fetch, even though drug_name has two tiers', async () => {
    // Guards against a future regression where `bad_request` falls through
    // to `continue` instead of returning: today, a `bad_request` outcome
    // matches neither the old `miss` nor `error` branch, so pre-fix it fell
    // through to the unconditional `hit = ...; break`, which also issued
    // only one fetch (it then crashed reading `hit.data.results`, which is
    // what the pre-fix RED run demonstrated — not a second HTTP call). This
    // test asserts on the call count directly so a later change that turns
    // `bad_request` into `continue` would be caught here.
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Nothing to count' } } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'serious' });

    expect(stub.calls.length).toBe(1);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).not.toContain('No drug-label records found');
  });

  it('suggests the suffix flip and names the stale descriptor when a count is rejected', async () => {
    const stub = stubFetchResponses([
      { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Nothing to count' } } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'openfda.route' });
    const text = result.content[0]!.text;
    expect(text).toContain('openfda.route.exact');
    expect(text).toContain('fields:countable');
  });

  it('reports a rejected argument generically when neither count nor sort was sent', async () => {
    // badArgumentText's generic branch (no count, no sort) is otherwise
    // never exercised by this file's other bad_request tests, all of which
    // supply a count.
    const details =
      '[illegal_argument_exception] Text fields are not optimised for operations that ' +
      'require per-document field data like aggregations and sorting. Please use a ' +
      'keyword field instead.';
    const stub = stubFetchResponses([
      { status: 500, body: { error: { code: 'SERVER_ERROR', message: 'Check your request and try again', details } } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil' });
    const text = result.content[0]!.text;

    expect(result.isError).toBe(true);
    expect(text).toContain('malformed');
    expect(text).toContain('keyword field');
    expect(text).not.toContain('Cannot aggregate');
  });

  it('names both count and sort as candidates, without blaming count alone, when both were sent', async () => {
    // openFDA's illegal_argument_exception covers both aggregation (count)
    // and sorting (sort), and its message does not say which parameter it
    // refused. A stale sortField would otherwise be misattributed to count
    // and pointed at the wrong diagnostic script.
    const details =
      '[illegal_argument_exception] Text fields are not optimised for operations that ' +
      'require per-document field data like aggregations and sorting. Please use a ' +
      'keyword field instead.';
    const stub = stubFetchResponses([
      { status: 500, body: { error: { code: 'SERVER_ERROR', message: 'Check your request and try again', details } } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), {
      value: 'Advil',
      count: 'openfda.route',
      sort: 'receivedate:desc',
    });
    const text = result.content[0]!.text;

    expect(result.isError).toBe(true);
    expect(text).toContain('count "openfda.route"');
    expect(text).toContain('sort "receivedate:desc"');
    expect(text).toContain('does not say which one');
    // Must not confidently assert count is the culprit the way the
    // count-only message does.
    expect(text).not.toContain('Cannot aggregate');
  });
});

describe('execute: response shaping', () => {
  it('returns the selected projection and the upstream total', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 214 } }, results: [{ openfda: { brand_name: ['Advil'] } }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', detail: 'summary' });
    expect(textOf(result)).toContain('"total": 214');
    expect(textOf(result)).toContain('"brand_name"');
    expect(textOf(result)).toContain('Showing 1 of 214');
  });

  it('rejects an unknown detail value', async () => {
    const stub = stubFetchResponses([{ body: {} }]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', detail: 'nope' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });

  it('echoes skip only when supplied, so paged responses are distinguishable', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 9 } }, results: [{}] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', skip: 20 });
    expect(textOf(result)).toContain('"skip": 20');
    expect(textOf(result)).toContain('starting at offset 20');
  });

  it('decodes coded terms on a count response and reports no total', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 1, count: 812 }, { term: 2, count: 44 }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'serious' });
    const text = textOf(result);
    expect(text).toContain('"term": "Serious"');
    expect(text).toContain('"term_code": 1');
    expect(text).toContain('"counted_by": "serious"');
    expect(text).not.toContain('"total"');
  });

  it('does not cap count buckets at the record default', async () => {
    // descriptor()'s limits.default is 1 (drug-label's real value), which
    // made an aggregation return a single bucket under a "Top 1 values"
    // header. limit is the record ceiling; buckets are a different quantity.
    const stub = stubFetchResponses([
      { body: { results: [{ term: 'ORAL', count: 9 }, { term: 'TOPICAL', count: 4 }] } },
    ]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil', count: 'serious' });
    expect(stub.calls[0]).toContain('limit=100');
  });

  it('lets an explicit limit cap buckets', async () => {
    const stub = stubFetchResponses([{ body: { results: [{ term: 'ORAL', count: 9 }] } }]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil', count: 'serious', limit: 3 });
    expect(stub.calls[0]).toContain('limit=3');
  });

  it('still uses the record default when not counting', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 5 } }, results: [{ openfda: {} }] } },
    ]);
    restore = stub.restore;
    await execute(descriptor(), { value: 'Advil' });
    expect(stub.calls[0]).toContain('limit=1');
  });

  it('advances next_skip past only the rows actually returned, not the rows fetched and dropped for budget', async () => {
    // 200 records, each padded with a 500-char brand_name, render to roughly
    // 200 * ~520 chars (JSON quoting plus the 2-space indent) ≈ 104,000
    // characters — comfortably over the 60,000-char MAX_RESPONSE_CHARS
    // budget regardless of exact per-record overhead, so fitToBudget is
    // guaranteed to drop trailing rows rather than merely might.
    const fetchedCount = 200;
    const records = Array.from({ length: fetchedCount }, () => ({
      openfda: { brand_name: ['X'.repeat(500)] },
    }));
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 1000 } }, results: records } },
    ]);
    restore = stub.restore;

    const result = await execute(descriptor(), {
      value: 'Advil',
      detail: 'summary',
      skip: 30,
    });
    const text = textOf(result);
    const envelope = JSON.parse(text.slice(text.indexOf('{')));

    // The budget must actually have bitten: fewer rows survived than were
    // fetched, and the drop count is not silently zero.
    expect(envelope.returned).toBeLessThan(fetchedCount);
    expect(envelope.dropped_for_budget).toBeGreaterThan(0);
    expect(envelope.dropped_for_budget).toBe(fetchedCount - envelope.returned);

    // The bug this test exists to catch: advancing by the fetched count (or
    // by the record `limit`) would step over exactly the rows dropped for
    // budget. Advancing by `returned` — the rows actually handed back — is
    // the only correct offset.
    expect(envelope.next_skip).toBe(30 + envelope.returned);
    expect(text).toContain(`continue from offset ${envelope.next_skip}`);
  });

  it('reports the bucket ceiling, since an aggregation carries no total', async () => {
    // returned === limit is the only signal a caller has that buckets were
    // cut off: openFDA sends no meta.results.total on an aggregation.
    const stub = stubFetchResponses([
      { body: { results: [{ term: 1, count: 812 }, { term: 2, count: 44 }] } },
    ]);
    restore = stub.restore;
    const result = await execute(descriptor(), { value: 'Advil', count: 'serious', limit: 2 });
    expect(result.content[0]!.text).toContain('"limit": 2');
  });
});
