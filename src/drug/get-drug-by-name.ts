/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { mapLabelFields } from './label-fields.js';
import { resolveLabel, notFoundMessage } from './resolve-label.js';
import { summarizeResults, withTotals } from '../utils/format.js';

export const getDrugByName = {
  name: 'get-drug-by-name',
  description:
    'Look up a drug by brand, generic or substance name. Returns brand_name, generic_name, manufacturer_name, product_ndc, substance_name, indications_and_usage, and the safety narrative: boxed_warning, warnings, warnings_and_cautions, do_not_use, ask_doctor, ask_doctor_or_pharmacist, stop_use and pregnancy_or_breast_feeding. Every field is always present, empty when the label has none. Reports matched_via to say which field matched, and a total for how many labels matched.',
  returnsFields: [
    'brand_name',
    'generic_name',
    'manufacturer_name',
    'product_ndc',
    'substance_name',
    'boxed_warning',
    'warnings',
    'warnings_and_cautions',
    'do_not_use',
    'ask_doctor',
    'ask_doctor_or_pharmacist',
    'stop_use',
    'pregnancy_or_breast_feeding',
    'indications_and_usage',
    'matched_via',
  ] as const,
  inputSchema: z.object({
    drugName: z.string().describe('Drug name'),
  }),
  async handler({ drugName }: { drugName: string }) {
    const resolved = await resolveLabel(drugName, 1);

    if (!resolved.found) {
      if (resolved.error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to retrieve drug data for "${drugName}": ${resolved.error.message}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: notFoundMessage(drugName) }],
      };
    }

    const drug = resolved.data.results[0];
    const drugInfo = {
      brand_name: drug?.openfda.brand_name,
      generic_name: drug?.openfda.generic_name,
      manufacturer_name: drug?.openfda.manufacturer_name,
      product_ndc: drug?.openfda.product_ndc,
      product_type: drug?.openfda.product_type,
      route: drug?.openfda.route,
      substance_name: drug?.openfda.substance_name,
      matched_via: resolved.matched_via,
      ...mapLabelFields(drug as unknown as Record<string, unknown>),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summarizeResults(1, resolved.data.meta?.results?.total, `labels matching "${drugName}"`)}\n\n${JSON.stringify(withTotals([drugInfo], resolved.data.meta?.results?.total, 1), null, 2)}`,
        },
      ],
    };
  },
};
