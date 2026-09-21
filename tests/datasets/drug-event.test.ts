import { describe, it, expect, afterEach } from 'vitest';
import { drugEvent } from '../../src/datasets/drug/event';
import { execute } from '../../src/core/executor';
import { validateDescriptor } from '../../src/core/descriptor';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

const page = (results: unknown[], total = results.length) => ({
  body: { meta: { results: { total } }, results },
});
const textOf = (r: { content: { text: string }[] }) => r.content[0]!.text;

const REPORT = {
  safetyreportid: '7',
  serious: 1,
  receiptdate: '20240101',
  patient: {
    patientonsetage: '44',
    patientsex: 2,
    reaction: [
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 },
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 },
      { reactionmeddrapt: 'NAUSEA', reactionoutcome: 6 },
    ],
  },
};

describe('drug-event descriptor', () => {
  it('is structurally valid', () => {
    expect(validateDescriptor(drugEvent)).toEqual([]);
  });

  it('ORs the three FAERS drug indexes in ONE query, because the union beats any single one', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN' });
    expect(stub.calls).toHaveLength(1);
    const query = decodeURIComponent(stub.calls[0]!);
    expect(query).toContain('patient.drug.openfda.generic_name:"IBUPROFEN"');
    expect(query).toContain('patient.drug.openfda.substance_name:"IBUPROFEN"');
    expect(query).toContain('patient.drug.medicinalproduct:"IBUPROFEN"');
  });

  it('applies seriousness to the WHOLE group, not just the last index', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN', seriousness: 'serious' });
    // Extract only the `search` query parameter — the brief's literal test
    // regexed the whole decoded URL (scheme, host, api_key, &limit=10
    // included) against an anchored ^...$ pattern, which cannot pass
    // against ANY correct implementation. That is the exact
    // transcription-error shape this plan has been warned about; the
    // parenthesisation claim (rule 6) is what this test must actually
    // prove, and it is provable only against the search string itself.
    const search = new URL(stub.calls[0]!).searchParams.get('search') ?? '';
    expect(search).toMatch(/^\(.+\) AND serious:"1"$/);
  });

  it('omits the filter entirely when seriousness is all', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    await execute(drugEvent, { value: 'IBUPROFEN', seriousness: 'all' });
    expect(decodeURIComponent(stub.calls[0]!)).not.toContain('serious:');
  });
});

describe('drug-event summary projection', () => {
  it('decodes serious and patient_sex, and keeps reaction/outcome arrays aligned', async () => {
    const stub = stubFetchResponses([page([REPORT])]);
    restore = stub.restore;
    const text = textOf(await execute(drugEvent, { value: 'IBUPROFEN' }));
    expect(text).toContain('"serious": "Serious"');
    expect(text).toContain('"patient_sex": "Female"');

    const record = JSON.parse(text.slice(text.indexOf('{'))).results[0];
    // Deduped on the PAIR: two identical (NAUSEA, 1) collapse, but
    // (NAUSEA, 6) is a genuinely different data point and must survive.
    expect(record.reactions).toEqual(['NAUSEA', 'NAUSEA']);
    expect(record.outcomes).toHaveLength(record.reactions.length);
    expect(record.outcomes[0]).not.toBe(record.outcomes[1]);
  });
});

describe('drug-event aggregation', () => {
  it('ranks reactions and reports no total', async () => {
    const stub = stubFetchResponses([
      { body: { results: [{ term: 'NAUSEA', count: 812 }] } },
    ]);
    restore = stub.restore;
    const text = textOf(
      await execute(drugEvent, {
        value: 'IBUPROFEN',
        count: 'patient.reaction.reactionmeddrapt.exact',
      })
    );
    expect(text).toContain('"term": "NAUSEA"');
    expect(text).toContain('"term_code": "NAUSEA"');
    expect(text).not.toContain('"total"');
  });

  it('decodes a coded aggregation field', async () => {
    const stub = stubFetchResponses([{ body: { results: [{ term: 2, count: 5 }] } }]);
    restore = stub.restore;
    const text = textOf(await execute(drugEvent, { value: 'X', count: 'patient.patientsex' }));
    expect(text).toContain('"term": "Female"');
    expect(text).toContain('"term_code": 2');
  });
});
