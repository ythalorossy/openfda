import { describe, it, expect } from 'vitest';
import { describeOutcome, REACTION_OUTCOMES } from '../../src/datasets/drug/faers';

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
