/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { ToolManager } from '../ToolManager.js';

export const getDrugByProductNdc = {
  name: 'get-drug-by-product-ndc',
  description:
    'Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.',
  inputSchema: z.object({
    productNDC: z.string().describe('Product NDC in format XXXXX-XXXX'),
  }),
  async handler({ productNDC }: { productNDC: string }) {
    if (!/^\d{5}-\d{4}$/.test(productNDC.trim())) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid product NDC format: "${productNDC}"\n\n✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`,
          },
        ],
        isError: true,
      };
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.product_ndc:"${productNDC.trim()}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `${url}Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
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
        ndc.startsWith(productNDC.trim())
      ) || [];

    const drugInfo = {
      product_ndc: productNDC,
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
          text: `✅ Product NDC "${productNDC}" found with ${allPackagesForProduct.length} package variation(s):\n\n${JSON.stringify(drugInfo, null, 2)}`,
        },
      ],
    };
  },
  register(toolManager: ToolManager) {
    toolManager.registerTool(this);
  },
};
