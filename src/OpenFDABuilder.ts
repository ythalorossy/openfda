/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { checkApiKey } from './utils/env.js';

/**
 * Open by design: the dataset and endpoint come from an EndpointDescriptor,
 * which is a closed compile-time set. Keeping them as string here is what lets
 * a new API group be added as data rather than as a union member.
 */
type DatasetType = string;
type EndpointType = string;

/**
 * The OpenFDABuilder class helps construct URLs for the OpenFDA API.
 *
 * Usage:
 *   - Set the dataset (such as 'drug' or 'food') using the dataset() method.
 *   - Set the endpoint (such as 'label', 'ndc', 'event' or 'enforcement') using
 *     the endpoint() method.
 *   - Set the search query using the search() method.
 *   - Optionally set the result limit using the limit() method (default is 1).
 *   - Call build() to assemble and return the final API URL.
 *
 * Example:
 *   const url = new OpenFDABuilder()
 *     .dataset('drug')
 *     .endpoint('label')
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

  endpoint(endpoint: EndpointType): this {
    this.params.set('endpoint', endpoint);
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
    const endpoint = this.params.get('endpoint');
    const search = this.params.get('search');
    const limit = this.params.get('limit') ?? 1;

    if (!dataset || !endpoint || !search) {
      throw new Error(
        'Missing required parameters: dataset, endpoint or search'
      );
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

    return `${this.urlBase}/${dataset}/${endpoint}.json?${query}`;
  }
}
