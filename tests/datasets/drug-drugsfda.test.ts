import { describe, it, expect, afterEach } from 'vitest';
import { drugDrugsfda } from '../../src/datasets/drug/drugsfda';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const APPLICATION = {
  application_number: 'NDA020235',
  sponsor_name: 'PFIZER',
  products: [{ product_number: '001', dosage_form: 'TABLET' }],
  submissions: Array.from({ length: 12 }, (_, i) => ({ submission_number: String(i) })),
};
const page = { body: { meta: { results: { total: 3 } }, results: [APPLICATION] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) => JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-drugsfda descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugDrugsfda)).toEqual([]);
  });

  it('uppercases sponsor_name, which openFDA stores uppercase', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('sponsor_name:"PFIZER"');
  });

  it('exposes application_number as a TOP-LEVEL path, not application.application_number', () => {
    const names = drugDrugsfda.fields.map((f) => f.name);
    expect(names).toContain('application_number');
    expect(names).not.toContain('application.application_number');
  });

  it('exposes exactly the 20 fields selected in the field-selection note', () => {
    expect(drugDrugsfda.fields).toHaveLength(20);
  });
});

describe('drug-drugsfda projections', () => {
  it('summary omits submissions but reports a submission_count', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer' }))
      .results[0];
    expect(record.submission_count).toBe(12);
    expect(record.submissions).toBeUndefined();
  });

  it('full caps submissions at 10 and flags the truncation', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(
      await execute(drugDrugsfda, { field: 'sponsor_name', value: 'Pfizer', detail: 'full' })
    ).results[0];
    expect(record.submissions).toHaveLength(10);
    expect(record.submissions_truncated).toBe(true);
  });

  it('does not flag truncation when there are 10 or fewer submissions', async () => {
    const stub = stubFetchResponses([
      {
        body: {
          meta: { results: { total: 1 } },
          results: [{ application_number: 'NDA1', sponsor_name: 'X', submissions: [{ submission_number: '1' }] }],
        },
      },
    ]);
    restore = stub.restore;
    const record = jsonOf(
      await execute(drugDrugsfda, { field: 'sponsor_name', value: 'X', detail: 'full' })
    ).results[0];
    expect(record.submissions).toHaveLength(1);
    expect(record.submissions_truncated).toBe(false);
  });

  it('emits te_code and openfda even when openFDA omits them', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 1 } }, results: [{ products: [{ product_number: '1' }] }] } },
    ]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugDrugsfda, { field: 'sponsor_name', value: 'X' })).results[0];
    expect(record.products[0].te_code).toBeNull();
    expect(record.openfda).toEqual({});
  });
});
