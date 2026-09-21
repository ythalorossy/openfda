/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Ceiling on a single tool response. A 1.1.0 get-drugsfda call returned 71,393
 * characters, which is both unusable and a context-exhaustion path when one
 * pathological upstream record floods an agent.
 */
export const MAX_RESPONSE_CHARS = 60000;

/**
 * Render as many rows as fit. Truncating serialized JSON would produce invalid
 * JSON, so rows are dropped and re-rendered instead. Always keeps at least one
 * row: an oversized single record is still more useful than nothing.
 */
export function fitToBudget<T>(
  results: readonly T[],
  render: (rows: readonly T[]) => string,
  max: number = MAX_RESPONSE_CHARS
): { text: string; kept: number; dropped: number } {
  let kept = results.length;
  let text = render(results);
  while (text.length > max && kept > 1) {
    kept -= 1;
    text = render(results.slice(0, kept));
  }
  return { text, kept, dropped: results.length - kept };
}
