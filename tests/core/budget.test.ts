import { describe, it, expect } from 'vitest';
import { fitToBudget, MAX_RESPONSE_CHARS } from '../../src/core/shape/budget';

const render = (rows: readonly string[]) => JSON.stringify(rows);

describe('fitToBudget', () => {
  it('keeps everything when it already fits', () => {
    const result = fitToBudget(['a', 'b'], render, 1000);
    expect(result.kept).toBe(2);
    expect(result.dropped).toBe(0);
    expect(result.text).toBe('["a","b"]');
  });

  it('drops rows from the end until the rendered text fits', () => {
    const rows = Array.from({ length: 20 }, () => 'x'.repeat(50));
    const result = fitToBudget(rows, render, 300);
    expect(result.text.length).toBeLessThanOrEqual(300);
    expect(result.kept).toBeLessThan(20);
    expect(result.dropped).toBe(20 - result.kept);
  });

  it('never drops below one row, so an oversized single record still returns', () => {
    const result = fitToBudget(['x'.repeat(500)], render, 100);
    expect(result.kept).toBe(1);
    expect(result.dropped).toBe(0);
  });

  it('exposes a ceiling large enough to be useful and small enough to bound a context', () => {
    // The uncapped get-drugsfda response that motivated this was 71,393 chars.
    expect(MAX_RESPONSE_CHARS).toBeLessThan(71393);
    expect(MAX_RESPONSE_CHARS).toBeGreaterThan(10000);
  });
});
