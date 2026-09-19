/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { checkApiKey } from './utils/env.js';

type DatasetType = 'drug';

// The ContextType type defines the valid OpenFDA API contexts that can be used with the OpenFDABuilder.
// These correspond to different OpenFDA drug endpoints, such as:
//   - 'ndc': National Drug Code Directory
//   - 'label': Drug Labeling
//   - 'event': Adverse Event Reporting
type ContextType = 'ndc' | 'label' | 'event' | 'drugsfda';

/**
 * The OpenFDABuilder class helps construct URLs for the OpenFDA API.
 *
 * Usage:
 *   - Set the dataset (such as 'drugs') using the dataset() method.
 *   - Set the context (such as 'label', 'ndc', or 'event') using the context() method.
 *   - Set the search query using the search() method.
 *   - Optionally set the result limit using the limit() method (default is 1).
 *   - Call build() to assemble and return the final API URL.
 *
 * Example:
 *   const url = new OpenFDABuilder()
 *     .dataset('drug')
 *     .context('label')
 *     .search('openfda.brand_name:"Advil"')
 *     .limit(1)
 *     .build();
 *
 * The build() method will throw an error if any required parameter is missing.
 * The API key is read from the OPENFDA_API_KEY environment variable.
 */
export class OpenFDABuilder {
  private readonly urlBase = 'https://api.fda.gov';
  private readonly params = new Map<string, string | number>();

  dataset(dataset: DatasetType): this {
    this.params.set('dataset', dataset);
    return this;
  }

  context(context: ContextType): this {
    this.params.set('context', context);
    return this;
  }

  search(query: string): this {
    this.params.set('search', query);
    return this;
  }

  limit(max: number = 1): this {
    this.params.set('limit', max);
    return this;
  }

  /** Aggregate by a field instead of returning records. */
  count(field: string): this {
    this.params.set('count', field);
    return this;
  }

  /** Offset into the result set. openFDA rejects values above 25000. */
  skip(n: number): this {
    this.params.set('skip', n);
    return this;
  }

  /** e.g. 'receivedate:desc'. */
  sort(order: string): this {
    this.params.set('sort', order);
    return this;
  }

  build(): string {
    const dataset = this.params.get('dataset');
    const context = this.params.get('context');
    const search = this.params.get('search');
    const limit = this.params.get('limit') ?? 1;

    if (!dataset || !context || !search) {
      throw new Error('Missing required parameters: context or search');
    }

    const status = checkApiKey();
    const query = new URLSearchParams();
    // Omitted entirely when keyless: `api_key=undefined` is rejected with
    // HTTP 403 API_KEY_INVALID, while no parameter at all is accepted.
    if (status.ok && status.apiKey) query.set('api_key', status.apiKey);
    query.set('search', String(search));
    query.set('limit', String(limit));
    // Optional parameters: emitted only when explicitly set, so an unset
    // value never reaches openFDA as an empty string.
    for (const key of ['count', 'skip', 'sort'] as const) {
      const value = this.params.get(key);
      if (value !== undefined) query.set(key, String(value));
    }

    return `${this.urlBase}/${dataset}/${context}.json?${query}`;
  }
}
