import { describe, it, expect, afterEach } from 'vitest';
import { drugEnforcement } from '../../src/datasets/drug/enforcement';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const RECALL = {
  recall_number: 'D-0001-2024',
  event_id: '87654',
  status: 'Ongoing',
  classification: 'Class II',
  recalling_firm: 'Acme Pharma',
  product_description: 'Ibuprofen tablets, 200mg',
  code_info: 'Lot 12345, exp 2025-01',
  reason_for_recall: 'Failed dissolution specifications',
  distribution_pattern: 'Nationwide',
  state: 'NJ',
  country: 'United States',
  voluntary_mandated: 'Voluntary: Firm initiated',
  report_date: '20240115',
  recall_initiation_date: '20231201',
  product_type: 'Drugs',
};
const page = { body: { meta: { results: { total: 7 } }, results: [RECALL] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) => JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-enforcement descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugEnforcement)).toEqual([]);
  });

  it('searches recall text by default, which is what a caller usually wants', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugEnforcement, { value: 'ibuprofen' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('product_description:"ibuprofen"');
  });

  it('can search the sparse but precise openfda names instead', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugEnforcement, { field: 'openfda.generic_name', value: 'ibuprofen' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('openfda.generic_name:"ibuprofen"');
  });

  it('summarises a recall with its classification, status and reason, without implying it is still live', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugEnforcement, { value: 'ibuprofen' })).results[0];
    expect(record.classification).toBe('Class II');
    expect(record.reason_for_recall).toBe('Failed dissolution specifications');
    expect(record.status).toBe('Ongoing');
    expect(record.event_id).toBe('87654');
    expect(record.code_info).toBe('Lot 12345, exp 2025-01');
  });

  it('reports termination_date as null, not absent, when a recall is still open', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugEnforcement, { value: 'ibuprofen' })).results[0];
    expect('termination_date' in record).toBe(true);
    expect(record.termination_date).toBeNull();
  });

  it('emits openfda as an empty object when the thin block is absent', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugEnforcement, { value: 'ibuprofen' })).results[0];
    expect(record.openfda).toEqual({});
  });

  it('can rank recalls by classification', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 'Class II', count: 43 }] } },
    ]);
    restore = stub.restore;
    const text = textOf(
      await execute(drugEnforcement, { value: 'ibuprofen', count: 'classification.exact' })
    );
    expect(text).toContain('"term": "Class II"');
    expect(text).toContain('"counted_by": "classification.exact"');
  });
});
