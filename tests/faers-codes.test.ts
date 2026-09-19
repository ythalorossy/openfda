import { describe, it, expect } from 'vitest';
import {
  SERIOUSNESS,
  PATIENT_SEX,
  CODED_COUNT_FIELDS,
  describeCountTerm,
} from '../src/drug/faers';

describe('FAERS code maps', () => {
  it('matches the documented seriousness values', () => {
    expect(Object.keys(SERIOUSNESS).sort()).toEqual(['1', '2']);
    expect(SERIOUSNESS['1']).toBe('Serious');
    expect(SERIOUSNESS['2']).toBe('Not serious');
  });

  it('matches the documented patient sex values', () => {
    expect(Object.keys(PATIENT_SEX).sort()).toEqual(['0', '1', '2']);
    expect(PATIENT_SEX['0']).toBe('Unknown');
    expect(PATIENT_SEX['1']).toBe('Male');
    expect(PATIENT_SEX['2']).toBe('Female');
  });

  it('registers exactly the coded count fields', () => {
    expect(Object.keys(CODED_COUNT_FIELDS).sort()).toEqual([
      'patient.patientsex',
      'patient.reaction.reactionoutcome',
      'serious',
    ]);
  });
});

describe('describeCountTerm', () => {
  it('decodes a numeric code, which is what openFDA actually sends', () => {
    // Measured: count terms for coded fields arrive as NUMBERS, not strings.
    expect(describeCountTerm('serious', 1)).toBe('Serious');
    expect(describeCountTerm('patient.patientsex', 2)).toBe('Female');
    expect(describeCountTerm('patient.reaction.reactionoutcome', 5)).toBe(
      'Fatal'
    );
  });

  it('decodes a string code too', () => {
    expect(describeCountTerm('serious', '2')).toBe('Not serious');
  });

  it('passes text fields through untouched', () => {
    expect(
      describeCountTerm(
        'patient.reaction.reactionmeddrapt.exact',
        'DRUG INEFFECTIVE'
      )
    ).toBe('DRUG INEFFECTIVE');
    expect(describeCountTerm('occurcountry.exact', 'US')).toBe('US');
  });

  it('does not invent a label for an unrecognised code', () => {
    expect(describeCountTerm('serious', 9)).toBe(
      'Unrecognized serious code "9"'
    );
  });

  it('reports an absent term honestly', () => {
    expect(describeCountTerm('serious', undefined)).toBe('Not reported');
    expect(describeCountTerm('serious', null)).toBe('Not reported');
  });
});
