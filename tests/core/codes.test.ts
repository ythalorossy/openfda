import { describe, it, expect } from 'vitest';
import { decodeTerm } from '../../src/core/codes';

const MAPS = {
  serious: { '1': 'Serious', '2': 'Not serious' },
  'patient.reaction.reactionoutcome': { '1': 'Recovered/resolved', '6': 'Unknown' },
};

describe('decodeTerm', () => {
  it('decodes a coded field to a label and keeps the raw value', () => {
    // openFDA sends coded fields as NUMBERS and text fields as strings.
    expect(decodeTerm(MAPS, 'serious', 1)).toEqual({ term: 'Serious', term_code: 1 });
  });

  it('passes a text field through with term and term_code identical', () => {
    expect(decodeTerm(MAPS, 'patient.reaction.reactionmeddrapt.exact', 'NAUSEA')).toEqual({
      term: 'NAUSEA',
      term_code: 'NAUSEA',
    });
  });

  it('matches a coded path even when the caller used the .exact suffix', () => {
    expect(decodeTerm(MAPS, 'serious.exact', 2)).toEqual({ term: 'Not serious', term_code: 2 });
  });

  it('falls back to the raw value for an unmapped code rather than inventing a label', () => {
    expect(decodeTerm(MAPS, 'serious', 9)).toEqual({ term: '9', term_code: 9 });
  });
});
