/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { normalizeNDC } from '../utils/ndc.js';
import { summarizeResults, withTotals } from '../utils/format.js';
import { invalidNdcMessage } from '../utils/ndc-formats.js';

export const getDrugByNdc = {
  name: 'get-drug-by-ndc',
  description:
    'Get drug information by National Drug Code (NDC). Accepts dashed formats: 4-4 (0456-4020), 5-3 (58151-155), 5-4 (12345-1234), and package NDC. Also accepts undashed 9-digit and 11-digit input. Undashed 8- and 10-digit input is rejected as ambiguous.',
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
            text: invalidNdcMessage(ndcCode, 'NDC'),
          },
        ],
        isError: true,
      };
    }

    let searchQuery = `openfda.product_ndc:"${productNDC}"`;

    if (packageNDC) {
      searchQuery += ` OR openfda.package_ndc:"${packageNDC}"`;
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
          text: `${summarizeResults(results.length, drugData.meta?.results?.total, `labels for NDC "${ndcCode}"`)} with ${totalPackages} package(s)\n\n${searchSummary}\n\n${JSON.stringify(withTotals(results, drugData.meta?.results?.total, 10), null, 2)}`,
        },
      ],
    };
  },
};
