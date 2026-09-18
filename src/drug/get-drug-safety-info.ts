/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { mapSafetyFields } from './label-fields.js';
import { resolveLabel, notFoundMessage } from './resolve-label.js';

export const getDrugSafetyInfo = {
  name: 'get-drug-safety-info',
  description:
    'Get comprehensive safety information for a drug including the boxed warning, warnings and cautions, contraindications, drug interactions, and precautions. Accepts a brand name, generic name, or active substance; the response reports which field matched via matched_via.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug brand name'),
  }),
  async handler({ drugName }: { drugName: string }) {
    const resolved = await resolveLabel(drugName, 1);

    if (!resolved.found) {
      if (resolved.error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to retrieve safety information for "${drugName}": ${resolved.error.message}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text', text: notFoundMessage(drugName) }],
      };
    }

    const drug = resolved.data.results[0];
    const safetyInfo = {
      drug_name: drug?.openfda.brand_name?.[0] || drugName,
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      matched_via: resolved.matched_via,
      ...mapSafetyFields(drug as unknown as Record<string, unknown>),
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
