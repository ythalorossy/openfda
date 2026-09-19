/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { summarizeResults, withTotals } from '../utils/format.js';

export const getDrugsByManufacturer = {
  name: 'get-drugs-by-manufacturer',
  description:
    'Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios. Returns results, up to limit, reporting matched_via, the total matched, and returned, the number actually sent back.',
  // Raw upstream records wrapped in an envelope: declare only the envelope
  // keys this tool guarantees (matched_via, total, returned, limit,
  // results), never inner record fields, because those vary per record.
  returnsFields: [
    'matched_via',
    'total',
    'returned',
    'limit',
    'results',
  ] as const,
  inputSchema: z.object({
    manufacturerName: z.string().describe('Manufacturer/company name'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of drugs to return'),
  }),
  async handler({
    manufacturerName,
    limit,
  }: {
    manufacturerName: string;
    limit?: number;
  }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.manufacturer_name:"${manufacturerName}"`)
      .limit(limit)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drugs found for manufacturer "${manufacturerName}".`,
          },
        ],
      };
    }

    const drugs = drugData.results.map((drug) => ({
      brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      product_type: drug?.openfda.product_type?.[0] || 'Unknown',
      route: drug?.openfda.route || [],
      ndc: drug?.openfda.product_ndc?.[0] || 'Unknown',
    }));

    return {
      content: [
        {
          type: 'text',
          text: `${summarizeResults(drugs.length, drugData.meta?.results?.total, `labels from manufacturer "${manufacturerName}"`)}\n\n${JSON.stringify({ matched_via: 'openfda.manufacturer_name', ...withTotals(drugs, drugData.meta?.results?.total, limit ?? 20) }, null, 2)}`,
        },
      ],
    };
  },
};
