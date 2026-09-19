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
    'Get drug information by product NDC. Accepts the dashed forms 4-4 (0456-4020), 5-3 (58151-155) and 5-4 (12345-1234), and undashed 8, 9 or 11-digit input which is assumed to have a 5-digit labeler. This ignores package variations and finds all packages for a product.',
  inputSchema: z.object({
    productNDC: z
      .string()
      .describe(
        'Product NDC: dashed 4-4 (0456-4020), 5-3 (58151-155) or 5-4 (12345-1234), or undashed 8/9/11-digit (assumes a 5-digit labeler)'
      ),
  }),
  async handler({ productNDC }: { productNDC: string }) {
    const { productNDC: normalizedNDC, isValid } = normalizeNDC(productNDC);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid product NDC format: "${productNDC}"\n\n✅ Accepted formats:\n• 4-4 product NDC: 0456-4020\n• 5-3 product NDC: 58151-155\n• 5-4 product NDC: 12345-1234\n• Undashed 8, 9 or 11 digits: 58151155, 123451234, 12345123401 (a 5-digit labeler is assumed)\n\nNote: a 10-digit undashed NDC is ambiguous (4-4-2, 5-3-2 and 5-4-1 all have ten digits), so dash it instead. If your labeler code has 4 digits, always dash it.`,
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
