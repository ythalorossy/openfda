/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { ToolManager } from '../ToolManager.js';

export const getDrugsByManufacturer = {
  name: 'get-drugs-by-manufacturer',
  description:
    'Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.',
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
            text: `${url}\nFailed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
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
          text: `Found ${drugs.length} drug(s) from manufacturer "${manufacturerName}":\n\n${JSON.stringify(drugs, null, 2)}`,
        },
      ],
    };
  },
  register(toolManager: ToolManager) {
    toolManager.registerTool(this);
  },
};
