/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { normalizeNDC } from '../utils/ndc.js';
import { ToolManager } from '../ToolManager.js';

export const getDrugByNdc = {
  name: 'get-drug-by-ndc',
  description:
    'Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.',
  inputSchema: z.object({
    ndcCode: z
      .string()
      .describe(
        'National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes'
      ),
  }),
  async handler({ ndcCode }: { ndcCode: string }) {
    const { productNDC, packageNDC, isValid } = normalizeNDC(ndcCode);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid NDC format: "${ndcCode}"\n\n✅ Accepted formats:\n• Product NDC: 12345-1234\n• Package NDC: 12345-1234-01\n• Without dashes: 123451234 or 12345123401`,
          },
        ],
        isError: true,
      };
    }

    let searchQuery = `openfda.product_ndc:"${productNDC}"`;

    if (packageNDC) {
      searchQuery += `+OR+openfda.package_ndc:"${packageNDC}"`;
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(searchQuery)
      .limit(10)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drug data for NDC "${ndcCode}": ${error.message}`,
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
            text: `No drug found with NDC "${ndcCode}" (product: ${productNDC}).\n\n💡 Tips:\n• Verify the NDC format\n• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)\n• Check if this is an FDA-approved product`,
          },
        ],
      };
    }

    const results = drugData.results.map((drug) => {
      const matchingProductNDCs =
        drug.openfda.product_ndc?.filter((ndc) => ndc === productNDC) || [];

      const matchingPackageNDCs =
        drug.openfda.package_ndc?.filter((ndc) =>
          packageNDC ? ndc === packageNDC : ndc.startsWith(productNDC)
        ) || [];

      return {
        brand_name: drug.openfda.brand_name || [],
        generic_name: drug.openfda.generic_name || [],
        manufacturer_name: drug.openfda.manufacturer_name || [],
        product_type: drug.openfda.product_type || [],
        route: drug.openfda.route || [],
        substance_name: drug.openfda.substance_name || [],
        matching_product_ndc: matchingProductNDCs,
        matching_package_ndc: matchingPackageNDCs,
        all_product_ndc: drug.openfda.product_ndc || [],
        all_package_ndc: drug.openfda.package_ndc || [],
        dosage_and_administration: drug.dosage_and_administration || [],
        package_label_principal_display_panel:
          drug.package_label_principal_display_panel || [],
        active_ingredient: drug.active_ingredient || [],
        purpose: drug.purpose || [],
      };
    });

    const totalPackages = results.reduce(
      (sum, result) => sum + result.matching_package_ndc.length,
      0
    );

    const searchSummary = packageNDC
      ? `Searched for specific package NDC: ${packageNDC}`
      : `Searched for product NDC: ${productNDC} (all packages)`;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Found ${results.length} drug(s) with ${totalPackages} package(s) for NDC "${ndcCode}"\n\n${searchSummary}\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  },
  register(toolManager: ToolManager) {
    toolManager.registerTool(this);
  },
};
