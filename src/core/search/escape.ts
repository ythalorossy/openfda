/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Escape a caller-supplied value for use inside a quoted openFDA phrase term.
 *
 * Verified live on 2026-09-20: `openfda.brand_name:"Advil" OR
 * openfda.brand_name:"Tylenol"` returns 150 — the sum of the two drugs — so an
 * unescaped value can append clauses and make the server answer about a
 * different drug than the one it reports. The same value with `\"` returns
 * NOT_FOUND, i.e. openFDA treats it as one literal term.
 *
 * Backslash must be escaped BEFORE the quote, or the caller's own backslash
 * consumes ours and the quote still closes the term.
 */
export function escapeSearchValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
