import { describe, it, expect } from 'vitest';
import { redactApiKey } from '../src/utils/redact';

describe('redactApiKey', () => {
  it('redacts the key when it is the first query parameter', () => {
    const input =
      'https://api.fda.gov/drug/label.json?api_key=SECRET123&search=x&limit=1';
    expect(redactApiKey(input)).toBe(
      'https://api.fda.gov/drug/label.json?api_key=<REDACTED>&search=x&limit=1'
    );
  });

  it('redacts the key when it is a later query parameter', () => {
    const input = 'https://api.fda.gov/drug/label.json?search=x&api_key=SECRET123';
    expect(redactApiKey(input)).toBe(
      'https://api.fda.gov/drug/label.json?search=x&api_key=<REDACTED>'
    );
  });

  it('redacts a key embedded mid-sentence without eating following prose', () => {
    const input = 'Request to ?api_key=SECRET123 failed with 500';
    expect(redactApiKey(input)).toBe('Request to ?api_key=<REDACTED> failed with 500');
  });

  it('is case-insensitive about the parameter name', () => {
    expect(redactApiKey('?API_KEY=SECRET123')).toBe('?API_KEY=<REDACTED>');
  });

  it('leaves strings without a key untouched', () => {
    expect(redactApiKey('no secrets here')).toBe('no secrets here');
  });
});
