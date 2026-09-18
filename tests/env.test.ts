import { describe, it, expect } from 'vitest';
import { checkApiKey, MISSING_KEY_MESSAGE } from '../src/utils/env';

describe('checkApiKey', () => {
  it('accepts a present key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: 'abc' })).toEqual({
      ok: true,
      apiKey: 'abc',
    });
  });

  it('trims surrounding whitespace from the key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: '  abc  ' })).toEqual({
      ok: true,
      apiKey: 'abc',
    });
  });

  it('rejects an absent key with an actionable message', () => {
    const status = checkApiKey({});
    expect(status.ok).toBe(false);
    expect(status).toHaveProperty('message', MISSING_KEY_MESSAGE);
  });

  it('rejects an empty or whitespace-only key', () => {
    expect(checkApiKey({ OPENFDA_API_KEY: '' }).ok).toBe(false);
    expect(checkApiKey({ OPENFDA_API_KEY: '   ' }).ok).toBe(false);
  });

  it('allows the keyless tier only when explicitly opted in', () => {
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: '1' })).toEqual({
      ok: true,
      apiKey: null,
    });
  });

  it('does not treat other OPENFDA_ALLOW_KEYLESS values as opt-in', () => {
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: 'true' }).ok).toBe(false);
    expect(checkApiKey({ OPENFDA_ALLOW_KEYLESS: '0' }).ok).toBe(false);
  });

  it('prefers a real key over the keyless opt-in', () => {
    expect(
      checkApiKey({ OPENFDA_API_KEY: 'abc', OPENFDA_ALLOW_KEYLESS: '1' })
    ).toEqual({ ok: true, apiKey: 'abc' });
  });

  it('never includes the key in the missing-key message', () => {
    expect(MISSING_KEY_MESSAGE).not.toMatch(/abc/);
    expect(MISSING_KEY_MESSAGE).toContain('OPENFDA_API_KEY is not set');
    expect(MISSING_KEY_MESSAGE).toContain('.env file is not loaded');
    expect(MISSING_KEY_MESSAGE).toContain('OPENFDA_ALLOW_KEYLESS=1');
  });
});
