/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { normalizeNDC } from '../utils/ndc.js';

export const getDrugByProductNdc = {
  name: 'get-drug-by-product-ndc',
  description:
    'Get drug information by product NDC (5-4 such as 12345-1234, or 5-3 such as 58151-155; also accepts undashed 8, 9, or 11-digit input). This ignores package variations and finds all packages for a product.',
  inputSchema: z.object({
    productNDC: z
      .string()
      .describe(
        'Product NDC, 5-4 (12345-1234) or 5-3 (58151-155), or undashed 8, 9, or 11-digit input'
      ),
  }),
  async handler({ productNDC }: { productNDC: string }) {
    const { productNDC: normalizedNDC, isValid } = normalizeNDC(productNDC);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid product NDC format: "${productNDC}"\n\n✅ Accepted formats:\n• 5-4 product NDC: 12345-1234\n• 5-3 product NDC: 58151-155\n• Undashed: 123451234 or 58151155\n\nNote: a 10-digit undashed NDC is ambiguous and is not accepted; include the dashes.`,
          },
        ],
        isError: true,
      };
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.product_ndc:"${normalizedNDC}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
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
            text: `No drug found with product NDC "${productNDC}".`,
          },
        ],
        structuredContent: null,
      };
    }

    const drug = drugData.results[0];

    const allPackagesForProduct =
      drug.openfda.package_ndc?.filter((ndc) =>
        ndc.startsWith(normalizedNDC)
      ) || [];

    const drugInfo = {
      product_ndc: normalizedNDC,
      available_packages: allPackagesForProduct,
      brand_name: drug.openfda.brand_name || [],
      generic_name: drug.openfda.generic_name || [],
      manufacturer_name: drug.openfda.manufacturer_name || [],
      product_type: drug.openfda.product_type || [],
      route: drug.openfda.route || [],
      substance_name: drug.openfda.substance_name || [],
      active_ingredient: drug.active_ingredient || [],
      purpose: drug.purpose || [],
      dosage_and_administration: drug.dosage_and_administration || [],
    };

    return {
      content: [
        {
          type: 'text',
          text: `✅ Product NDC "${normalizedNDC}" found with ${allPackagesForProduct.length} package variation(s):\n\n${JSON.stringify(drugInfo, null, 2)}`,
        },
      ],
    };
  },
};
