import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { describeOutcome, REACTION_OUTCOMES } from '../src/drug/faers';
import { getDrugAdverseEvents } from '../src/drug/get-drug-adverse-events';
import { stubFetch } from './helpers/stubFetch';

describe('describeOutcome', () => {
  it('maps every documented FAERS outcome code', () => {
    expect(describeOutcome('1')).toBe('Recovered/resolved');
    expect(describeOutcome('2')).toBe('Recovering/resolving');
    expect(describeOutcome('3')).toBe('Not recovered/not resolved');
    expect(describeOutcome('4')).toBe('Recovered/resolved with sequelae');
    expect(describeOutcome('5')).toBe('Fatal');
    expect(describeOutcome('6')).toBe('Unknown');
  });

  it('covers exactly codes 1 through 6', () => {
    expect(Object.keys(REACTION_OUTCOMES).sort()).toEqual([
      '1', '2', '3', '4', '5', '6',
    ]);
  });

  it('does not silently invent a label for an unrecognized code', () => {
    expect(describeOutcome('9')).toBe('Unrecognized outcome code "9"');
    expect(describeOutcome(undefined)).toBe('Not reported');
  });

  it('accepts a numeric code as well as a string', () => {
    expect(describeOutcome(5)).toBe('Fatal');
  });
});

describe('get-drug-adverse-events reaction mapping', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub?.restore();
  });

  /** Run the handler against a single record with the given raw reactions. */
  async function runWithReactions(
    reaction: { reactionmeddrapt: string; reactionoutcome: string }[]
  ) {
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            safetyreportid: '123',
            serious: '1',
            patient: { reaction },
          },
        ],
      },
    ]);

    const result = await getDrugAdverseEvents.handler({
      drugName: 'x',
      limit: 1,
      seriousness: 'all',
    });
    const text = result.content[0].text;

    // The text is `${summary}\n\n${json}`; the summary line is not JSON, so
    // parse only the payload after the blank-line separator rather than
    // asserting on the formatted whitespace of the whole string.
    const jsonStart = text.indexOf('\n\n') + 2;
    const payload = JSON.parse(text.slice(jsonStart));
    return payload.results[0];
  }

  it('deduplicates repeated (reaction, outcome) pairs and decodes outcome codes', async () => {
    const record = await runWithReactions([
      { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
      { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
      { reactionmeddrapt: 'Gait disturbance', reactionoutcome: '5' },
    ]);

    expect(record.reactions).toHaveLength(2);
    expect(record.reactions).toEqual(['Tremor', 'Gait disturbance']);
    expect(record.outcomes).toEqual(['Recovered/resolved', 'Fatal']);
  });

  it('keeps reactions and outcomes positionally aligned when no pairs repeat', async () => {
    // Three DISTINCT reactions with outcomes [1, 1, 5]. If reactions and
    // outcomes were deduplicated independently, outcomes would collapse to
    // length 2 ([Recovered/resolved, Fatal]) while reactions stayed length
    // 3, silently attributing "Fatal" to the wrong (middle) reaction.
    const record = await runWithReactions([
      { reactionmeddrapt: 'A', reactionoutcome: '1' },
      { reactionmeddrapt: 'B', reactionoutcome: '1' },
      { reactionmeddrapt: 'C', reactionoutcome: '5' },
    ]);

    expect(record.reactions).toHaveLength(record.outcomes.length);
    expect(record.reactions).toEqual(['A', 'B', 'C']);
    expect(record.outcomes).toEqual([
      'Recovered/resolved',
      'Recovered/resolved',
      'Fatal',
    ]);
    // "Fatal" must sit at the same index as the reaction it belongs to (C).
    const fatalIndex = record.outcomes.indexOf('Fatal');
    expect(record.reactions[fatalIndex]).toBe('C');
  });

  it('keeps both pairs when the same reaction term has two different outcome codes', async () => {
    const record = await runWithReactions([
      { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
      { reactionmeddrapt: 'Tremor', reactionoutcome: '5' },
    ]);

    expect(record.reactions).toEqual(['Tremor', 'Tremor']);
    expect(record.outcomes).toEqual(['Recovered/resolved', 'Fatal']);
  });
});
