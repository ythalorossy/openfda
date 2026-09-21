import { describe, it, expect, afterEach } from 'vitest';
import { drugShortages } from '../../src/datasets/drug/shortages';
import { drugLabel } from '../../src/datasets/drug/label';
import { DRUG_ENDPOINTS } from '../../src/datasets/drug/index';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const SHORTAGE = {
  generic_name: 'AMOXICILLIN',
  company_name: 'Example Labs',
  status: 'Currently in Shortage',
  dosage_form: 'ORAL SUSPENSION',
  presentation: '250mg/5mL, 100mL bottle',
  therapeutic_category: ['Anti-Infective'],
  package_ndc: '12345-678-90',
  update_type: 'Revised',
  initial_posting_date: '20231001',
  update_date: '20240115',
  discontinued_date: '',
  contact_info: '1-800-555-0100',
};
const page = { body: { meta: { results: { total: 3 } }, results: [SHORTAGE] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-shortages descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugShortages)).toEqual([]);
  });

  it('completes the drug group at seven endpoints', () => {
    expect(DRUG_ENDPOINTS).toHaveLength(7);
    expect(DRUG_ENDPOINTS.map((d) => d.endpoint).sort()).toEqual([
      'drugsfda', 'enforcement', 'event', 'label', 'ndc', 'orangebook', 'shortages',
    ]);
  });

  it('searches by generic name, the way shortages are actually tracked', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugShortages, { value: 'AMOXICILLIN' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('generic_name:"AMOXICILLIN"');
  });

  it('reports status and both dates so a resolved shortage is obvious', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugShortages, { value: 'AMOXICILLIN' })).results[0];
    expect(record.status).toBe('Currently in Shortage');
    expect(record.initial_posting_date).toBe('20231001');
    expect(record.update_date).toBe('20240115');
  });

  it('normalises an upstream empty-string date to null instead of passing it through', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugShortages, { value: 'AMOXICILLIN' })).results[0];
    expect(record.discontinued_date).toBeNull();
  });

  it('uses a different generic_name path from drug-label, because the datasets differ', () => {
    const shortagesPath = drugShortages.fields.find((f) => f.name === 'generic_name')!.strategy;
    const labelPath = drugLabel.fields.find((f) => f.name === 'generic_name')!.strategy;
    expect(shortagesPath).toEqual({ kind: 'exact', path: 'generic_name' });
    expect(labelPath).toEqual({ kind: 'exact', path: 'openfda.generic_name' });
  });

  it('does not declare openfda.generic_name, which FDA does not publish for this endpoint', () => {
    const names = drugShortages.fields.map((f) => f.name);
    expect(names).not.toContain('openfda.generic_name');
  });
});
