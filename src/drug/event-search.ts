/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * FAERS indexes a drug three ways. `medicinalproduct` is the product name as
 * the reporter typed it, so searching it alone misses reports filed under a
 * brand name, a misspelling, or a combination-product string.
 *
 * Measured for citalopram: medicinalproduct 113,881; openfda.generic_name
 * 136,043; the union of all three 143,346. The union beats every single
 * field, which is why this is an OR rather than a tiered fallback — a
 * fallback would match medicinalproduct first and never reach the better
 * index.
 */
export const EVENT_SEARCH_FIELDS = [
  'patient.drug.openfda.generic_name',
  'patient.drug.openfda.substance_name',
  'patient.drug.medicinalproduct',
] as const;

export const EVENT_MATCHED_VIA = `union(${EVENT_SEARCH_FIELDS.join(', ')})`;

/**
 * Operators are space-separated. URLSearchParams encodes a space to `+`,
 * which is the wire form openFDA expects; a literal `+` would encode to
 * `%2B` and silently return NOT_FOUND.
 */
export function buildEventSearch(drugName: string): string {
  return EVENT_SEARCH_FIELDS.map((field) => `${field}:"${drugName}"`).join(
    ' OR '
  );
}
