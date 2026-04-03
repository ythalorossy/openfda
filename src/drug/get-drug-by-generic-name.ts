/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugByGenericName = {
  name: 'get-drug-by-generic-name',
  description:
    'Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.',
  inputSchema: z.object({
    genericName: z.string().describe('Generic drug name (active ingredient)'),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum number of results to return'),
  }),
  async handler({
    genericName,
    limit,
  }: {
    genericName: string;
    limit?: number;
  }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.generic_name:"${genericName}"`)
      .limit(limit)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drug data for generic name "${genericName}": ${error.message}`,
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
            text: `No drug information found for generic name "${genericName}".`,
          },
        ],
      };
    }

    const drugs = drugData.results.map((drug) => ({
      brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      manufacturer_name: drug?.openfda.manufacturer_name?.[0] || 'Unknown',
      product_type: drug?.openfda.product_type?.[0] || 'Unknown',
      route: drug?.openfda.route || [],
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${drugs.length} drug(s) with generic name "${genericName}":\n\n${JSON.stringify(drugs, null, 2)}`,
        },
      ],
    };
  },
};
