/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { mapLabelFields } from './label-fields.js';
import { resolveLabel, notFoundMessage } from './resolve-label.js';

export const getDrugByName = {
  name: 'get-drug-by-name',
  description:
    'Get drug information by brand name, generic name, or active substance. Returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding. The response reports which field matched via matched_via.',
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
          text: `Drug information retrieved successfully:\n\n${JSON.stringify(drugInfo, null, 2)}`,
        },
      ],
    };
  },
};
