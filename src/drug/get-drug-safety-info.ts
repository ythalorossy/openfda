/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugSafetyInfo = {
  name: 'get-drug-safety-info',
  description:
    'Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug brand name'),
  }),
  async handler({ drugName }: { drugName: string }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.brand_name:"${drugName}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve safety information for "${drugName}": ${error.message}`,
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
            text: `No safety information found for "${drugName}".`,
          },
        ],
      };
    }

    const drug = drugData.results[0];
    const safetyInfo = {
      drug_name: drug?.openfda.brand_name?.[0] || drugName,
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      warnings: drug?.warnings || [],
      contraindications: drug?.contraindications || [],
      drug_interactions: drug?.drug_interactions || [],
      precautions: drug?.precautions || [],
      adverse_reactions: drug?.adverse_reactions || [],
      overdosage: drug?.overdosage || [],
      do_not_use: drug?.do_not_use || [],
      ask_doctor: drug?.ask_doctor || [],
      stop_use: drug?.stop_use || [],
      pregnancy_or_breast_feeding: drug?.pregnancy_or_breast_feeding || [],
    };

    return {
      content: [
        {
          type: 'text',
          text: `Safety information for "${drugName}":\n\n${JSON.stringify(safetyInfo, null, 2)}`,
        },
      ],
    };
  },
};
