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
    fetchStub = stubFetch([
      {
        meta: { results: { skip: 0, limit: 1, total: 1 } },
        results: [
          {
            safetyreportid: '123',
            serious: '1',
            patient: {
              reaction: [
                { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
                { reactionmeddrapt: 'Tremor', reactionoutcome: '1' },
                { reactionmeddrapt: 'Gait disturbance', reactionoutcome: '5' },
              ],
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

  it('deduplicates repeated reaction terms and decodes outcome codes', async () => {
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
    const record = payload.results[0];

    expect(record.reactions).toHaveLength(2);
    expect(record.reactions).toEqual(['Tremor', 'Gait disturbance']);
    expect(record.outcomes).toEqual(['Recovered/resolved', 'Fatal']);
  });
});
