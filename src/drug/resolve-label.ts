/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import type { OpenFDAResponse, OpenFDAError } from '../types.js';

export type MatchedVia =
  | 'openfda.brand_name'
  | 'openfda.generic_name'
  | 'openfda.substance_name'
  | 'spl_product_data_elements';

/**
 * Searched in order, stopping at the first tier with results.
 *
 * Exact brand search alone misses real originator brands: Cordarone and
 * Glucophage are absent from openfda.brand_name but present in the label's
 * own spl_product_data_elements. Tiers stay separate sequential queries
 * rather than one OR-ed query so relevance ordering stays predictable.
 */
export const RESOLUTION_TIERS: readonly MatchedVia[] = [
  'openfda.brand_name',
  'openfda.generic_name',
  'openfda.substance_name',
  'spl_product_data_elements',
];

export type ResolveResult =
  | { found: true; matched_via: MatchedVia; data: OpenFDAResponse }
  | { found: false; error?: OpenFDAError };

export async function resolveLabel(
  term: string,
  limit = 1
): Promise<ResolveResult> {
  let lastError: OpenFDAError | undefined;

  for (const field of RESOLUTION_TIERS) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`${field}:"${term}"`)
      .limit(limit)
      .build();

    const { data, error } = await makeOpenFDARequest<OpenFDAResponse>(url);

    // A miss on one tier is expected, not fatal: keep walking the tiers.
    if (error) {
      lastError = error;
      continue;
    }
    if (data?.results && data.results.length > 0) {
      return { found: true, matched_via: field, data };
    }
  }

  return { found: false, error: lastError };
}

/** Wording for the not-found path; the README promises suggestions. */
export const notFoundMessage = (term: string): string =>
  `No label found for "${term}".\n\nSearched, in order: ${RESOLUTION_TIERS.join(', ')}.\n\nSuggestions:\n- Check the spelling.\n- Try the generic name instead of the brand (e.g. "amiodarone" rather than "Cordarone").\n- Try the originator brand rather than a repackager's name.\n- Some discontinued brands have no current FDA label.`;
