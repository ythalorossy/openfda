import { describe, it, expect } from 'vitest';
import { NDC_FORMATS, invalidNdcMessage } from '../src/utils/ndc-formats';

describe('NDC_FORMATS', () => {
  it('lists every accepted form', () => {
    for (const form of ['4-4', '5-3', '5-4', '0456-4020', '58151-155']) {
      expect(NDC_FORMATS).toContain(form);
    }
  });

  it('explains why undashed 8 and 10 digits are refused', () => {
    expect(NDC_FORMATS).toContain('ambiguous');
    expect(NDC_FORMATS).toContain('8');
    expect(NDC_FORMATS).toContain('10');
  });

  it('builds a message naming the offending input', () => {
    expect(invalidNdcMessage('nope', 'NDC')).toContain('"nope"');
    expect(invalidNdcMessage('nope', 'NDC')).toContain(NDC_FORMATS);
  });
});
