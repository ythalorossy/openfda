import { describe, it, expect } from 'vitest';
import { normalizeNDC } from '../src/utils/ndc';

describe('normalizeNDC', () => {
  it('accepts a 5-4 product NDC', () => {
    expect(normalizeNDC('12345-1234')).toEqual({
      productNDC: '12345-1234',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts a 5-3 product NDC, which this server emits for Lipitor', () => {
    expect(normalizeNDC('58151-155')).toEqual({
      productNDC: '58151-155',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts a 5-4-2 package NDC and derives the product NDC', () => {
    expect(normalizeNDC('12345-1234-01')).toEqual({
      productNDC: '12345-1234',
      packageNDC: '12345-1234-01',
      isValid: true,
    });
  });

  it('accepts a 5-3-2 package NDC', () => {
    expect(normalizeNDC('58151-155-01')).toEqual({
      productNDC: '58151-155',
      packageNDC: '58151-155-01',
      isValid: true,
    });
  });

  it('accepts a 9-digit undashed NDC as 5-4', () => {
    expect(normalizeNDC('123451234')).toEqual({
      productNDC: '12345-1234',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts an 8-digit undashed NDC as 5-3', () => {
    expect(normalizeNDC('58151155')).toEqual({
      productNDC: '58151-155',
      packageNDC: null,
      isValid: true,
    });
  });

  it('accepts an 11-digit undashed NDC as 5-4-2', () => {
    expect(normalizeNDC('12345123401')).toEqual({
      productNDC: '12345-1234',
      packageNDC: '12345-1234-01',
      isValid: true,
    });
  });

  it('rejects a 10-digit undashed NDC as ambiguous', () => {
    expect(normalizeNDC('1234512340').isValid).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(normalizeNDC('not-an-ndc').isValid).toBe(false);
    expect(normalizeNDC('12345').isValid).toBe(false);
    expect(normalizeNDC('12345-1234-01-99').isValid).toBe(false);
    expect(normalizeNDC('').isValid).toBe(false);
  });

  it('tolerates surrounding whitespace', () => {
    expect(normalizeNDC('  58151-155  ').isValid).toBe(true);
  });
});
