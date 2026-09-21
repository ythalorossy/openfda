/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export interface DecodedTerm {
  term: string;
  term_code: string | number;
}

/**
 * Decode one aggregated term. Coded fields become a human label; text fields
 * pass through with `term` and `term_code` identical. `term_code` always keeps
 * the raw upstream value, so a caller aggregating by code is unaffected.
 *
 * An unmapped code returns the raw value rather than a guessed label: a wrong
 * label is indistinguishable from real data.
 */
export function decodeTerm(
  codeMaps: Record<string, Record<string, string>>,
  path: string,
  raw: string | number
): DecodedTerm {
  const map = codeMaps[path] ?? codeMaps[path.replace(/\.exact$/, '')];
  const decoded = map?.[String(raw)];
  return { term: decoded ?? String(raw), term_code: raw };
}
