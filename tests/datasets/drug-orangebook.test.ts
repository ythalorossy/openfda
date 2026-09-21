import { describe, it, expect, afterEach } from 'vitest';
import { drugOrangebook } from '../../src/datasets/drug/orangebook';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

// `products.marketing_status` is deliberately absent: it is not published
// in FDA's own field reference for this endpoint (drugorangebook.yaml), so
// it is neither a searchable field nor a projected one — see the note this
// descriptor cites and tests/catalog-conformance.test.ts, which would fail
// if it were declared as a field or countField/sortField.
const ENTRY = {
  approval_date: '20090928',
  product_number: '003',
  products: [
    {
      active_ingredients: [
        { name: 'CARBIDOPA', strength: '25MG' },
        { name: 'LEVODOPA', strength: '250MG' },
      ],
      brand_name: 'CARBIDOPA AND LEVODOPA',
      application_number: '090324',
      application_type: 'A',
      application_name: 'MYLAN',
      application_full_name: 'MYLAN PHARMACEUTICALS INC',
      therapeutic_equivalence_codes: 'AB',
      reference_listed_drug: false,
      reference_standard: false,
      dosage_form: 'TABLET',
      route: 'ORAL',
    },
  ],
};
const page = { body: { meta: { results: { total: 2 } }, results: [ENTRY] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-orangebook descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugOrangebook)).toEqual([]);
  });

  it('searches the nested products array, where the data actually lives', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    await execute(drugOrangebook, { value: 'CARBIDOPA AND LEVODOPA' });
    // URLSearchParams encodes a space as "+", which decodeURIComponent does
    // not undo — normalise it the same way the rest of this suite's fixtures
    // avoid by using single-word values.
    const query = decodeURIComponent(stub.calls[0]!).replace(/\+/g, ' ');
    expect(query).toContain('products.brand_name:"CARBIDOPA AND LEVODOPA"');
  });

  it('flattens each product with its ingredients, applicant names and TE code', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.approval_date).toBe('20090928');
    expect(record.products).toHaveLength(1);
    expect(record.products[0].active_ingredients).toHaveLength(2);
    expect(record.products[0].application_name).toBe('MYLAN');
    expect(record.products[0].application_full_name).toBe('MYLAN PHARMACEUTICALS INC');
    expect(record.products[0].therapeutic_equivalence_codes).toBe('AB');
  });

  it('emits the boolean equivalence flags as false, not null, when the fact is false', async () => {
    const stub = stubFetchResponses([page]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.products[0].reference_listed_drug).toBe(false);
    expect(record.products[0].reference_standard).toBe(false);
  });

  it('emits the boolean equivalence flags as null when genuinely absent', async () => {
    const stub = stubFetchResponses([
      {
        body: {
          meta: { results: { total: 1 } },
          results: [{ approval_date: '20200101', products: [{ brand_name: 'X' }] }],
        },
      },
    ]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.products[0].reference_listed_drug).toBeNull();
    expect(record.products[0].reference_standard).toBeNull();
  });

  it('emits products as an empty array when the entry carries none', async () => {
    const stub = stubFetchResponses([
      { body: { meta: { results: { total: 1 } }, results: [{ approval_date: '20200101' }] } },
    ]);
    restore = stub.restore;
    const record = jsonOf(await execute(drugOrangebook, { value: 'X' })).results[0];
    expect(record.products).toEqual([]);
  });

  it('does not declare products.marketing_status, which FDA does not publish for this endpoint', () => {
    const names = drugOrangebook.fields.map((f) => f.name);
    expect(names).not.toContain('products.marketing_status');
    expect(drugOrangebook.countFields).not.toContain('products.marketing_status');
  });
});
