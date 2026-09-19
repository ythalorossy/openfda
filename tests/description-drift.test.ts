import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDrugByName } from '../src/drug/get-drug-by-name';
import { getDrugSafetyInfo } from '../src/drug/get-drug-safety-info';
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { stubFetch } from './helpers/stubFetch';

const TOOLS = [
  { name: 'get-drug-by-name', tool: getDrugByName },
  { name: 'get-drug-safety-info', tool: getDrugSafetyInfo },
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
});
