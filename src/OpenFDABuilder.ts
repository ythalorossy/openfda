/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

// The ContextType type defines the valid OpenFDA API contexts that can be used with the OpenFDABuilder.
// These correspond to different OpenFDA drug endpoints, such as:
//   - 'ndc': National Drug Code Directory
//   - 'label': Drug Labeling
//   - 'event': Adverse Event Reporting
type ContextType = "ndc" | "label" | "event";

/**
 * The OpenFDABuilder class helps construct URLs for the OpenFDA API.
 *
 * Usage:
 *   - Set the context (such as 'label', 'ndc', or 'event') using the context() method.
 *   - Set the search query using the search() method.
 *   - Optionally set the result limit using the limit() method (default is 1).
 *   - Call build() to assemble and return the final API URL.
 *
 * Example:
 *   const url = new OpenFDABuilder()
 *     .context('label')
 *     .search('openfda.brand_name:"Advil"')
 *     .limit(1)
 *     .build();
 *
 * The build() method will throw an error if any required parameter is missing.
 * The API key is read from the OPENFDA_API_KEY environment variable.
 */
export class OpenFDABuilder {
  private url = "https://api.fda.gov/drug/";
  private params = new Map<string, string | number>();

  context(context: ContextType): this {
    this.params.set("context", context);
    return this;
  }

  search(query: string): this {
    this.params.set("search", query);
    return this;
  }

  limit(max: number = 1): this {
    this.params.set("limit", max);
    return this;
  }

  build(): string {
    const context = this.params.get("context");
    const search = this.params.get("search");
    const limit = this.params.get("limit");
    const apiKey = process.env.OPENFDA_API_KEY;

    if (!context || !search || !limit) {
      throw new Error("Missing required parameters: context, search, or limit");
    }

    return `${this.url}${context}.json?api_key=${apiKey}&search=${search}&limit=${limit}`;
  }
}
