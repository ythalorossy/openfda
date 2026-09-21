import { describe, it, expect, afterEach } from 'vitest';
import { drugNdc } from '../../src/datasets/drug/ndc';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const RECORD = {
  product_ndc: '0002-0800',
  generic_name: 'INSULIN LISPRO',
  brand_name: 'HUMALOG',
  labeler_name: 'Eli Lilly and Company',
  dosage_form: 'INJECTION, SOLUTION',
  route: ['SUBCUTANEOUS'],
  product_type: 'HUMAN PRESCRIPTION DRUG',
  marketing_category: 'BLA',
  application_number: 'BLA020563',
  active_ingredients: [{ name: 'INSULIN LISPRO', strength: '100 [iU]/mL' }],
  packaging: [{ package_ndc: '0002-0800-01', description: '1 VIAL' }],
  finished: true,
};
const page = { body: { meta: { results: { total: 4 } }, results: [RECORD] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-ndc descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugNdc)).toEqual([]);
  });

  it('searches the NDC Directory, not the label index', () => {
    expect(drugNdc.endpoint).toBe('ndc');
    expect(drugNdc.toolName).toBe('drug-ndc');
  });

  it('normalises a product NDC before searching', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    // '0002-0800-01' is the packaging fixture's package NDC; normalizing it
    // for a product_ndc search must strip the package suffix and search on
    // the bare product NDC ('0002-0800'), proving the normalizer actually
    // ran rather than the raw value being passed through untouched.
    await execute(drugNdc, { field: 'product_ndc', value: '0002-0800-01' });
    expect(decodeURIComponent(stub.calls[0]!)).toContain('product_ndc:"0002-0800"');
  });

  it('summarises a directory entry with its packaging', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugNdc, { field: 'brand_name', value: 'HUMALOG' })).results[0];
    expect(record.product_ndc).toBe('0002-0800');
    expect(record.package_ndc).toEqual(['0002-0800-01']);
    expect(record.active_ingredients).toEqual([{ name: 'INSULIN LISPRO', strength: '100 [iU]/mL' }]);
  });
});
