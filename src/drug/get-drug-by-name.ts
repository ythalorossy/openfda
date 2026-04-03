/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugByName = {
  name: 'get-drug-by-name',
  description:
    'Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug name'),
  }),
  async handler({ drugName }: { drugName: string }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.brand_name:"${drugName}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      let errorMessage = `Failed to retrieve drug data for "${drugName}": ${error.message}`;

      switch (error.type) {
        case 'http':
          if (error.status === 404) {
            errorMessage += `${url}\n\nSuggestions:\n- Verify the exact brand name spelling\n- Try searching for the generic name instead\n- Check if the drug is FDA-approved`;
          } else if (error.status === 401 || error.status === 403) {
            errorMessage += `\n\nPlease check the API key configuration.`;
          }
          break;
        case 'network':
          errorMessage += `\n\nPlease check your internet connection and try again.`;
          break;
        case 'timeout':
          errorMessage += `\n\nThe request took too long. Please try again.`;
          break;
      }

      return {
        content: [{ type: 'text' as const, text: errorMessage }],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No drug information found for "${drugName}". Please verify the brand name spelling or try searching for the generic name.`,
          },
        ],
      };
    }

    const drug = drugData.results[0];
    const drugInfo = {
      brand_name: drug?.openfda.brand_name,
      generic_name: drug?.openfda.generic_name,
      manufacturer_name: drug?.openfda.manufacturer_name,
      product_ndc: drug?.openfda.product_ndc,
      product_type: drug?.openfda.product_type,
      route: drug?.openfda.route,
      substance_name: drug?.openfda.substance_name,
      indications_and_usage: drug?.indications_and_usage,
      warnings: drug?.warnings,
      do_not_use: drug?.do_not_use,
      ask_doctor: drug?.ask_doctor,
      ask_doctor_or_pharmacist: drug?.ask_doctor_or_pharmacist,
      stop_use: drug?.stop_use,
      pregnancy_or_breast_feeding: drug?.pregnancy_or_breast_feeding,
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
