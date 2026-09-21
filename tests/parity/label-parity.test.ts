import { describe, it, expect, afterEach } from 'vitest';
import { drugLabel } from '../../src/datasets/drug/label';
import { execute } from '../../src/core/executor';
import { getDrugByName } from '../../src/drug/get-drug-by-name';
import { getDrugSafetyInfo } from '../../src/drug/get-drug-safety-info';
import { getDrugByProductNdc } from '../../src/drug/get-drug-by-product-ndc';
import { RESOLUTION_TIERS } from '../../src/drug/resolve-label';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const LABEL = {
  openfda: {
    brand_name: ['Advil'],
    generic_name: ['IBUPROFEN'],
    substance_name: ['IBUPROFEN'],
    manufacturer_name: ['Pfizer'],
    product_ndc: ['12345-1234'],
    package_ndc: ['12345-1234-01'],
    product_type: ['HUMAN OTC DRUG'],
    route: ['ORAL'],
  },
  boxed_warning: ['BOXED'],
  warnings: ['WARN'],
  contraindications: ['CONTRA'],
  indications_and_usage: ['USE'],
};
const page = { body: { meta: { results: { total: 39 } }, results: [LABEL] } };
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(textOf(r).slice(textOf(r).indexOf('{')));

describe('drug-label matches the 1.x tools it replaces', () => {
  it('uses the same four resolution tiers as resolve-label', () => {
    const field = drugLabel.fields.find((f) => f.name === 'drug_name')!;
    const paths = field.strategy.kind === 'tiered' ? field.strategy.paths : [];
    expect(paths).toEqual([...RESOLUTION_TIERS]);
  });

  it('issues the same first query as get-drug-by-name', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugByName.handler({ drugName: 'Advil', limit: 1 });
    const oldUrl = oldStub.calls[0]!;
    oldStub.restore();

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    await execute(drugLabel, { value: 'Advil', limit: 1 });
    const newUrl = newStub.calls[0]!;

    const search = (url: string) => new URL(url).searchParams.get('search');
    expect(search(newUrl)).toBe(search(oldUrl));
  });

  it('returns the same narrative values as get-drug-by-name', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugByName.handler({ drugName: 'Advil', limit: 1 });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    ).results[0];

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(await execute(drugLabel, { value: 'Advil', limit: 1 })).results[0];

    for (const field of [
      'substance_name', 'brand_name', 'generic_name', 'manufacturer_name', 'product_ndc',
      'route', 'boxed_warning', 'warnings', 'indications_and_usage',
    ]) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
  });

  it('returns the same safety values as get-drug-safety-info, with the documented rename', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugSafetyInfo.handler({ drugName: 'Advil' });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    );

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(await execute(drugLabel, { value: 'Advil', detail: 'safety' }))
      .results[0];

    for (const field of [
      'boxed_warning', 'warnings', 'contraindications', 'drug_interactions', 'precautions',
      'adverse_reactions', 'overdosage', 'ask_doctor_or_pharmacist',
    ]) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
    expect(newRecord.generic_name).toEqual(oldRecord.generic_name);

    // DOCUMENTED DIFF: the 1.x scalar `drug_name` (brand, or the query term
    // when the label had none) becomes the honest array `brand_name`. Recorded
    // in the README migration table.
    expect(oldRecord.drug_name).toBe('Advil');
    expect(newRecord.brand_name).toEqual(['Advil']);
  });

  // The 1.x `get-drug-by-product-ndc` tool no longer has a direct one-field
  // equivalent: ruling 1 of the task-15 dispatch folds `product_ndc` into
  // the virtual `ndc` field (which also ORs in `package_ndc` when a package
  // part is supplied), rather than exposing `product_ndc` a second time.
  // Feeding `ndc` a bare product NDC (no package suffix) exercises exactly
  // the single-clause path `get-drug-by-product-ndc` always took, so the
  // two must still issue an identical query.
  it('issues the same query as get-drug-by-product-ndc for the same bare product NDC', async () => {
    const oldStub = stubFetchResponses([page]);
    await getDrugByProductNdc.handler({ productNDC: '12345-1234' });
    const oldSearch = new URL(oldStub.calls[0]!).searchParams.get('search');
    oldStub.restore();

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    await execute(drugLabel, { field: 'ndc', value: '12345-1234' });
    expect(new URL(newStub.calls[0]!).searchParams.get('search')).toBe(oldSearch);
  });
});
