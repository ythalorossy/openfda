import { describe, it, expect, afterEach } from 'vitest';
import { drugLabel } from '../../src/datasets/drug/label';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const NOT_FOUND = { status: 404, body: { error: { code: 'NOT_FOUND' } } };
const page = (results: unknown[], total = results.length) => ({
  body: { meta: { results: { total } }, results },
});
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;

describe('drug-label descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugLabel)).toEqual([]);
  });

  it('resolves drug_name through four tiers in the documented order', () => {
    const field = drugLabel.fields.find((f) => f.name === 'drug_name')!;
    expect(field.strategy).toEqual({
      kind: 'tiered',
      paths: [
        'openfda.brand_name',
        'openfda.generic_name',
        'openfda.substance_name',
        'spl_product_data_elements',
      ],
    });
  });

  it('offers summary, safety and full as detail values', () => {
    expect(drugLabel.projections.map((p) => p.name)).toEqual(['summary', 'safety', 'full']);
  });
});

describe('drug-label summary projection', () => {
  it('leads with substance_name so a combination product is obvious at a glance', async () => {
    const stub = stubFetchResponses([
      page([{ openfda: { substance_name: ['IBUPROFEN', 'ACETAMINOPHEN'], brand_name: ['Advil Dual Action'] } }]),
    ]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'Advil' }));
    const substanceAt = text.indexOf('"substance_name"');
    const brandAt = text.indexOf('"brand_name"');
    expect(substanceAt).toBeGreaterThan(-1);
    expect(substanceAt).toBeLessThan(brandAt);
  });

  it('emits every safety narrative field, empty when the label has none', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'Advil' }));
    for (const field of [
      'boxed_warning', 'warnings', 'warnings_and_cautions', 'do_not_use',
      'ask_doctor', 'ask_doctor_or_pharmacist', 'stop_use', 'pregnancy_or_breast_feeding',
      'indications_and_usage',
    ]) {
      expect(text, `${field} must be present even when empty`).toContain(`"${field}"`);
    }
  });

  it('falls back to warnings_and_cautions for a PLR label that has no warnings', async () => {
    const stub = stubFetchResponses([
      page([{ openfda: {}, warnings_and_cautions: ['PLR text'] }]),
    ]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'X' }));
    expect(text).toContain('PLR text');
  });
});

describe('drug-label safety projection', () => {
  it('returns the full safety set and a null generic_name rather than "Unknown"', async () => {
    const stub = stubFetchResponses([page([{ openfda: {}, contraindications: ['none'] }])]);
    restore = stub.restore;
    const text = textOf(await execute(drugLabel, { value: 'X', detail: 'safety' }));
    for (const field of [
      'contraindications', 'drug_interactions', 'precautions', 'adverse_reactions', 'overdosage',
    ]) {
      expect(text).toContain(`"${field}"`);
    }
    expect(text).toContain('"generic_name": null');
  });
});

describe('drug-label ndc fields', () => {
  it('ORs product and package NDC when a package NDC was supplied', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    await execute(drugLabel, { field: 'ndc', value: '12345-1234-01' });
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('openfda.product_ndc:"12345-1234"');
    expect(query).toContain('openfda.package_ndc:"12345-1234-01"');
  });

  it('searches product NDC alone when no package part was given', async () => {
    const stub = stubFetchResponses([page([{ openfda: {} }])]);
    restore = stub.restore;
    await execute(drugLabel, { field: 'ndc', value: '12345-1234' });
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('openfda.product_ndc:"12345-1234"');
    expect(query).not.toContain('package_ndc');
  });

  it('rejects ambiguous undashed input before querying', async () => {
    const stub = stubFetchResponses([page([])]);
    restore = stub.restore;
    const result = await execute(drugLabel, { field: 'ndc', value: '12345678' });
    expect(result.isError).toBe(true);
    expect(stub.calls).toHaveLength(0);
  });
});

describe('drug-label not-found', () => {
  it('reports no results after all four tiers miss, without isError', async () => {
    const stub = stubFetchResponses([NOT_FOUND, NOT_FOUND, NOT_FOUND, NOT_FOUND]);
    restore = stub.restore;
    const result = await execute(drugLabel, { value: 'Zzzz' });
    expect(stub.calls).toHaveLength(4);
    expect(result.isError).toBeUndefined();
    expect(textOf(result)).toContain('spl_product_data_elements');
  });
});
