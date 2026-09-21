import { describe, it, expect } from 'vitest';
import { escapeSearchValue } from '../../src/core/search/escape';

describe('escapeSearchValue', () => {
  it('leaves an ordinary value untouched', () => {
    expect(escapeSearchValue('Advil')).toBe('Advil');
    expect(escapeSearchValue('Children s Tylenol')).toBe('Children s Tylenol');
  });

  it('escapes the double quote that ends a phrase term', () => {
    expect(escapeSearchValue('Advil"')).toBe('Advil\\"');
  });

  it('escapes a backslash before escaping quotes, so the escape cannot be escaped away', () => {
    // A naive quote-only escape turns `\"` into `\\"`, where the caller's own
    // backslash consumes ours and the quote closes the term anyway.
    expect(escapeSearchValue('a\\"b')).toBe('a\\\\\\"b');
  });

  it('neutralises the real injection vector', () => {
    // Verified live 2026-09-20: unescaped, this returns Advil+Tylenol (150);
    // escaped, openFDA treats the whole thing as one literal term.
    const injected = 'Advil" OR openfda.brand_name:"Tylenol';
    expect(escapeSearchValue(injected)).toBe('Advil\\" OR openfda.brand_name:\\"Tylenol');
  });

  it('does not alter Lucene operators, which are inert inside a quoted phrase', () => {
    expect(escapeSearchValue('a AND b')).toBe('a AND b');
    expect(escapeSearchValue('a+b-c')).toBe('a+b-c');
  });

  it('handles unicode and empty input', () => {
    expect(escapeSearchValue('acetilsalicílico')).toBe('acetilsalicílico');
    expect(escapeSearchValue('')).toBe('');
  });
});
