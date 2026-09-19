/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { mapSafetyFields } from './label-fields.js';
import {
  resolveLabel,
  notFoundMessage,
  resolveGenericName,
} from './resolve-label.js';

export const getDrugSafetyInfo = {
  name: 'get-drug-safety-info',
  description:
    'Get safety information for a drug. Returns drug_name, generic_name, boxed_warning, warnings, warnings_and_cautions, contraindications, drug_interactions, precautions, adverse_reactions, overdosage, do_not_use, ask_doctor, stop_use and pregnancy_or_breast_feeding. Every field is always present, empty when the label has none, so an empty boxed_warning means the drug has none rather than that it was not checked. Accepts a brand, generic or substance name and reports matched_via.',
  returnsFields: [
    'drug_name',
    'generic_name',
    'matched_via',
    'boxed_warning',
    'warnings',
    'warnings_and_cautions',
    'contraindications',
    'drug_interactions',
    'precautions',
    'adverse_reactions',
    'overdosage',
    'do_not_use',
    'ask_doctor',
    'stop_use',
    'pregnancy_or_breast_feeding',
  ] as const,
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
      generic_name: resolveGenericName(
        (drug?.openfda ?? {}) as unknown as Record<string, unknown>
      ),
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
