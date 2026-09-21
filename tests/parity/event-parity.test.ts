import { describe, it, expect, afterEach } from 'vitest';
import { drugEvent } from '../../src/datasets/drug/event';
import { execute } from '../../src/core/executor';
import { getDrugAdverseEvents } from '../../src/drug/get-drug-adverse-events';
import { getDrugAdverseEventCounts } from '../../src/drug/get-drug-adverse-event-counts';
import { EVENT_SEARCH_FIELDS } from '../../src/drug/event-search';
import { stubFetchResponses } from '../helpers/stubFetchResponses';

let restore = () => {};
afterEach(() => restore());

// A record populated across every field both the old and new tools read —
// a report passing with zero populated fields would prove nothing.
const REPORT = {
  safetyreportid: '7',
  serious: 1,
  receiptdate: '20240101',
  patient: {
    patientonsetage: '44',
    patientsex: 2,
    reaction: [{ reactionmeddrapt: 'NAUSEA', reactionoutcome: 1 }],
  },
};
const page = { body: { meta: { results: { total: 5 } }, results: [REPORT] } };
const jsonOf = (r: { content: { text: string }[] }) =>
  JSON.parse(r.content[0]!.text.slice(r.content[0]!.text.indexOf('{')));

describe('drug-event matches the 1.x event tools', () => {
  it('searches the same three FAERS indexes', () => {
    const field = drugEvent.fields.find((f) => f.name === 'drug_name')!;
    const paths =
      field.strategy.kind === 'anyOf' ? [...field.strategy.paths].sort() : [];
    expect(paths).toEqual([...EVENT_SEARCH_FIELDS].sort());
  });

  it('produces the same record fields as get-drug-adverse-events', async () => {
    const oldStub = stubFetchResponses([page]);
    const oldOut = await getDrugAdverseEvents.handler({
      drugName: 'IBUPROFEN',
      limit: 10,
    });
    oldStub.restore();
    const oldRecord = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    ).results[0];

    const newStub = stubFetchResponses([page]);
    restore = newStub.restore;
    const newRecord = jsonOf(
      await execute(drugEvent, { value: 'IBUPROFEN', limit: 10 })
    ).results[0];

    // Confirm the fixture is actually populated on both sides — a match on
    // two empty/undefined values would prove nothing.
    expect(oldRecord.reactions.length).toBeGreaterThan(0);
    expect(newRecord.reactions.length).toBeGreaterThan(0);

    for (const field of ['report_id', 'serious', 'patient_sex', 'reactions', 'outcomes']) {
      expect(newRecord[field], `${field} diverged`).toEqual(oldRecord[field]);
    }
    // DOCUMENTED DIFF: the 1.x tool falls back to the string 'Unknown' when
    // patientonsetage is absent; the descriptor uses null instead. Not
    // exercised here since patientonsetage IS populated on this fixture —
    // both read the same populated value.
    expect(oldRecord.patient_age).toBe('44');
    expect(newRecord.patient_age).toBe('44');
  });

  it('produces the same ranked terms as get-drug-adverse-event-counts', async () => {
    const counts = { body: { results: [{ term: 'NAUSEA', count: 812 }] } };

    const oldStub = stubFetchResponses([counts]);
    const oldOut = await getDrugAdverseEventCounts.handler({
      drugName: 'IBUPROFEN',
      limit: 10,
    });
    oldStub.restore();
    const oldPayload = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    );

    const newStub = stubFetchResponses([counts]);
    restore = newStub.restore;
    const newPayload = jsonOf(
      await execute(drugEvent, {
        value: 'IBUPROFEN',
        limit: 10,
        count: 'patient.reaction.reactionmeddrapt.exact',
      })
    );

    expect(oldPayload.results.length).toBeGreaterThan(0);
    expect(newPayload.results).toEqual(oldPayload.results);
    expect(newPayload.counted_by).toBe(oldPayload.counted_by);
  });

  it('decodes a coded count field the same way as get-drug-adverse-event-counts', async () => {
    const counts = { body: { results: [{ term: 1, count: 23172 }] } };

    const oldStub = stubFetchResponses([counts]);
    const oldOut = await getDrugAdverseEventCounts.handler({
      drugName: 'IBUPROFEN',
      field: 'serious',
      limit: 10,
    });
    oldStub.restore();
    const oldPayload = JSON.parse(
      oldOut.content[0]!.text.slice(oldOut.content[0]!.text.indexOf('{'))
    );

    const newStub = stubFetchResponses([counts]);
    restore = newStub.restore;
    const newPayload = jsonOf(
      await execute(drugEvent, {
        value: 'IBUPROFEN',
        limit: 10,
        count: 'serious',
      })
    );

    // Both must decode the raw code 1 to "Serious", not pass it through raw —
    // proves the parity is on DECODED behaviour, not just structural shape.
    expect(oldPayload.results[0].term).toBe('Serious');
    expect(newPayload.results).toEqual(oldPayload.results);
  });
});
