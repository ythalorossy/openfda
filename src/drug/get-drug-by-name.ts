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
    'Look up a drug by brand, generic or substance name. Returns an array of labels (default 1, up to limit), each with substance_name, brand_name, generic_name, manufacturer_name, product_ndc, indications_and_usage, and the safety narrative: boxed_warning, warnings, warnings_and_cautions, do_not_use, ask_doctor, ask_doctor_or_pharmacist, stop_use and pregnancy_or_breast_feeding. Every field is always present, empty when the label has none. Reports matched_via to say which field matched, and a total for how many labels matched. The first label is not necessarily the most canonical one — a popular brand can have dozens of labels, and the top match is often a combination product (e.g. "Advil" can return Advil Dual Action with Acetaminophen before plain ibuprofen). substance_name is listed first in each label specifically so a combination product is obvious at a glance. Use limit and skip to page through the rest when the total is high or the first result looks like a combination.',
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
    drugName: z.string().describe('Drug name (brand, generic or substance)'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .default(1)
      .describe('Maximum number of labels to return'),
    skip: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        'Offset into the matching labels. The first label is not necessarily the most canonical one — for a brand with many labels, skip reaches the others.'
      ),
  }),
  async handler({
    drugName,
    limit,
    skip,
  }: {
    drugName: string;
    limit?: number;
    skip?: number;
  }) {
    const resolved = await resolveLabel(drugName, limit ?? 1, skip);

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

    const drugInfo = resolved.data.results.map((drug) => ({
      // substance_name first: a combination product must be obvious at a
      // glance, because the top match for a brand is often a combination.
      substance_name: drug?.openfda.substance_name,
      brand_name: drug?.openfda.brand_name,
      generic_name: drug?.openfda.generic_name,
      manufacturer_name: drug?.openfda.manufacturer_name,
      product_ndc: drug?.openfda.product_ndc,
      product_type: drug?.openfda.product_type,
      route: drug?.openfda.route,
      matched_via: resolved.matched_via,
      ...mapLabelFields(drug as unknown as Record<string, unknown>),
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summarizeResults(drugInfo.length, resolved.data.meta?.results?.total, `labels matching "${drugName}"`)}\n\n${JSON.stringify(withTotals(drugInfo, resolved.data.meta?.results?.total, limit ?? 1), null, 2)}`,
        },
      ],
    };
  },
};
