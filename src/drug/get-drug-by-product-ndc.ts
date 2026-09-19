/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { normalizeNDC } from '../utils/ndc.js';
import { invalidNdcMessage } from '../utils/ndc-formats.js';

export const getDrugByProductNdc = {
  name: 'get-drug-by-product-ndc',
  description:
    'Get drug information by product NDC. Accepts the dashed forms 4-4 (0456-4020), 5-3 (58151-155) and 5-4 (12345-1234), plus undashed 9-digit (5-4) and 11-digit (5-4-2) input. Undashed 8- and 10-digit input is rejected as ambiguous — dash it. This ignores package variations and finds all packages for a product. Returns product_ndc, available_packages, brand_name, generic_name, manufacturer_name, product_type, route, substance_name, active_ingredient, purpose and dosage_and_administration; every field is always present, empty when the label has none.',
  // Fixed payload of named fields (one record, not an envelope over many):
  // every key here is always set on the success path, defaulting to an
  // empty array when the upstream label omits it.
  returnsFields: [
    'product_ndc',
    'available_packages',
    'brand_name',
    'generic_name',
    'manufacturer_name',
    'product_type',
    'route',
    'substance_name',
    'active_ingredient',
    'purpose',
    'dosage_and_administration',
  ] as const,
  inputSchema: z.object({
    productNDC: z
      .string()
      .describe(
        'Product NDC: dashed 4-4 (0456-4020), 5-3 (58151-155) or 5-4 (12345-1234); undashed 9-digit (123451234) or 11-digit (12345123401) also work'
      ),
  }),
  async handler({ productNDC }: { productNDC: string }) {
    const { productNDC: normalizedNDC, isValid } = normalizeNDC(productNDC);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: invalidNdcMessage(productNDC, 'product NDC'),
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
