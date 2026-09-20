import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { getDrugSafetyInfo } from '../src/drug/get-drug-safety-info';
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { getDrugAdverseEventCounts } from '../src/drug/get-drug-adverse-event-counts';
import { getDrugByGenericName } from '../src/drug/get-drug-by-generic-name';
import { getDrugsByManufacturer } from '../src/drug/get-drugs-by-manufacturer';
import { getDrugByNdc } from '../src/drug/get-drug-by-ndc';
import { getDrugByProductNdc } from '../src/drug/get-drug-by-product-ndc';
import { getDrugsfda } from '../src/drug/get-drugsfda';
import { stubFetch } from './helpers/stubFetch';

// Every tool below must satisfy both halves of the guard:
//   (a) its description names each field in `returnsFields`
//   (b) the handler actually EMITS each declared field (half (b) is the one
//       that would have caught the fabricated get-drugsfda field names)
//
// Two shapes of tool exist here:
//
// - Fixed-payload tools (get-drug-by-name, get-drug-safety-info,
//   get-drug-by-product-ndc) build one named object per call. They declare
//   the actual field names of that object.
// - Envelope tools (get-drugsfda, get-drug-by-generic-name,
//   get-drugs-by-manufacturer, get-drug-by-ndc, get-drug-adverse-events,
//   get-drug-adverse-event-counts) wrap raw upstream records that vary per
//   record. They cannot declare inner record fields (brand_name, reactions,
//   etc.) because those are not guaranteed by the tool itself — only by
//   whatever openFDA happens to send back. They declare only the envelope
//   keys the tool itself guarantees, e.g. matched_via, total, returned,
//   limit, results. Do NOT "fix" this by adding inner record fields; that
//   is exactly the guard this file exists to prevent.
const TOOLS = [
  { name: 'get-drug-by-name', tool: getDrugByName },
  { name: 'get-drug-safety-info', tool: getDrugSafetyInfo },
  { name: 'get-drug-adverse-events', tool: getDrugAdverseEvents },
  { name: 'get-drug-adverse-event-counts', tool: getDrugAdverseEventCounts },
  { name: 'get-drug-by-generic-name', tool: getDrugByGenericName },
  { name: 'get-drugs-by-manufacturer', tool: getDrugsByManufacturer },
  { name: 'get-drug-by-ndc', tool: getDrugByNdc },
  { name: 'get-drug-by-product-ndc', tool: getDrugByProductNdc },
  { name: 'get-drugsfda', tool: getDrugsfda },
];

describe('tool descriptions do not drift from what tools return', () => {
  for (const { name, tool } of TOOLS) {
    it(`${name} declares the fields it returns`, () => {
      expect(Array.isArray((tool as any).returnsFields)).toBe(true);
      expect((tool as any).returnsFields.length).toBeGreaterThan(0);
    });

    it(`${name}'s description mentions every field it declares`, () => {
      for (const field of (tool as any).returnsFields as string[]) {
        expect(
          tool.description,
          `${name} returns "${field}" but never names it in its description`
        ).toContain(field);
      }
    });
  }

  it('get-drug-by-name advertises the boxed warning it returns', () => {
    // The headline fix of 1.1.0 was invisible to a model reading the schema.
    expect(getDrugByName.description).toContain('boxed_warning');
    expect((getDrugByName as any).returnsFields).toContain('boxed_warning');
  });

  it('get-drug-adverse-events surfaces the unsorted-sampling caveat at the top level', () => {
    // The caveat also lives in the `sort` param's describe(); a model reading
    // only the top-level description must still see it. Match on a
    // distinctive substring rather than the whole sentence, so a future
    // rewording doesn't make this brittle.
    expect(getDrugAdverseEvents.description).toContain('report_id');
  });
});

describe('declared fields are actually returned', () => {
  // The half of the guard that catches fabrication: a tool could name a
  // field in both its description and returnsFields and still never emit
  // it — which is exactly how five invented application_docs field names
  // shipped. Drive each handler and compare against real output keys.
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            openfda: {
              brand_name: ['ZESTRIL'],
              generic_name: ['LISINOPRIL'],
              manufacturer_name: ['X'],
              product_ndc: ['12345-1234'],
              substance_name: ['LISINOPRIL'],
            },
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  /** Reset the shared stub with a tool-specific response shape. */
  function respondWith(body: unknown) {
    fetchStub.restore();
    fetchStub = stubFetch([body]);
  }

  it('get-drug-by-name emits every field it declares', async () => {
    const result = await getDrugByName.handler({ drugName: 'Zestril' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const emitted = payload.results ? payload.results[0] : payload;

    for (const field of (getDrugByName as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(emitted, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-safety-info emits every field it declares', async () => {
    const result = await getDrugSafetyInfo.handler({ drugName: 'Zestril' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugSafetyInfo as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-by-name emits every declared field when openfda is empty', async () => {
    // Rayos and Cordarone reach the label with a fully empty openfda object
    // (resolved via spl_product_data_elements). A fixture with populated
    // openfda cannot catch a handler that silently drops fields via
    // undefined passthrough, because JSON.stringify removes undefined keys.
    respondWith({
      meta: { results: { skip: 0, limit: 1, total: 1 } },
      results: [{ openfda: {} }],
    });

    const result = await getDrugByName.handler({ drugName: 'Rayos' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));
    const emitted = payload.results ? payload.results[0] : payload;

    for (const field of (getDrugByName as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(emitted, field),
        `declared "${field}" but did not emit it when openfda is empty`
      ).toBe(true);
    }
  });

  it('get-drug-safety-info emits every declared field when openfda is empty', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 1, total: 1 } },
      results: [{ openfda: {} }],
    });

    const result = await getDrugSafetyInfo.handler({ drugName: 'Rayos' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugSafetyInfo as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it when openfda is empty`
      ).toBe(true);
    }
  });

  it('get-drug-adverse-events emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 1, total: 1 } },
      results: [
        {
          safetyreportid: '1',
          patient: {
            reaction: [{ reactionmeddrapt: 'Nausea', reactionoutcome: '1' }],
          },
        },
      ],
    });

    const result = await getDrugAdverseEvents.handler({ drugName: 'citalopram' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugAdverseEvents as any)
      .returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-adverse-event-counts emits every field it declares', async () => {
    respondWith({ results: [{ term: 'Nausea', count: 5 }] });

    const result = await getDrugAdverseEventCounts.handler({
      drugName: 'citalopram',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugAdverseEventCounts as any)
      .returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-by-generic-name emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 5, total: 1 } },
      results: [
        {
          openfda: {
            brand_name: ['ZESTRIL'],
            generic_name: ['LISINOPRIL'],
            manufacturer_name: ['X'],
            product_type: ['HUMAN PRESCRIPTION DRUG'],
            route: ['ORAL'],
          },
        },
      ],
    });

    const result = await getDrugByGenericName.handler({
      genericName: 'lisinopril',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugByGenericName as any)
      .returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drugs-by-manufacturer emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 20, total: 1 } },
      results: [
        {
          openfda: {
            brand_name: ['ZESTRIL'],
            generic_name: ['LISINOPRIL'],
            product_type: ['HUMAN PRESCRIPTION DRUG'],
            route: ['ORAL'],
            product_ndc: ['12345-1234'],
          },
        },
      ],
    });

    const result = await getDrugsByManufacturer.handler({
      manufacturerName: 'X',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugsByManufacturer as any)
      .returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-by-ndc emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 10, total: 1 } },
      results: [
        {
          openfda: {
            brand_name: ['ZESTRIL'],
            generic_name: ['LISINOPRIL'],
            manufacturer_name: ['X'],
            product_type: ['HUMAN PRESCRIPTION DRUG'],
            route: ['ORAL'],
            substance_name: ['LISINOPRIL'],
            product_ndc: ['12345-1234'],
            package_ndc: ['12345-1234-01'],
          },
          dosage_and_administration: ['Take once daily'],
          package_label_principal_display_panel: ['Panel'],
          active_ingredient: ['Lisinopril'],
          purpose: ['Antihypertensive'],
        },
      ],
    });

    const result = await getDrugByNdc.handler({ ndcCode: '12345-1234' });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugByNdc as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drug-by-product-ndc emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 1, total: 1 } },
      results: [
        {
          openfda: {
            package_ndc: ['12345-1234-01'],
            brand_name: ['ZESTRIL'],
            generic_name: ['LISINOPRIL'],
            manufacturer_name: ['X'],
            product_type: ['HUMAN PRESCRIPTION DRUG'],
            route: ['ORAL'],
            substance_name: ['LISINOPRIL'],
          },
          active_ingredient: ['Lisinopril'],
          purpose: ['Antihypertensive'],
          dosage_and_administration: ['Take once daily'],
        },
      ],
    });

    const result = await getDrugByProductNdc.handler({
      productNDC: '12345-1234',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugByProductNdc as any)
      .returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });

  it('get-drugsfda emits every field it declares', async () => {
    respondWith({
      meta: { results: { skip: 0, limit: 5, total: 1 } },
      results: [{ application_number: 'NDA000001', sponsor_name: 'UPJOHN' }],
    });

    const result = await getDrugsfda.handler({
      sectionName: 'application',
      fieldName: 'application_number',
      searchValue: 'NDA000001',
    });
    const text = result.content[0].text;
    const payload = JSON.parse(text.slice(text.indexOf('{')));

    for (const field of (getDrugsfda as any).returnsFields as string[]) {
      expect(
        Object.prototype.hasOwnProperty.call(payload, field),
        `declared "${field}" but did not emit it`
      ).toBe(true);
    }
  });
});
