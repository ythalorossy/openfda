/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { OpenFDAResponse } from '../types.js';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugsfda = {
  name: 'get-drugsfda',
  description:
    'Get drugsfda data by section and field. Search OpenFDA drugsfda endpoint by specifying a section (application, openfda, products, submissions, application_docs), a field name within that section, and a search value.',
  inputSchema: z.object({
    sectionName: z
      .string()
      .describe(
        'Section within drugsfda. Valid values: application, openfda, products, submissions, application_docs'
      ),
    fieldName: z
      .string()
      .describe(
        'Field name within the selected section. ' +
          'application: application_number. ' +
          'openfda: application_number, brand_name, generic_name, manufacturer_name, nui, package_ndc, pharm_class_cs, pharm_class_epc, pharm_class_pe, pharm_class_moa, product_ndc, route, rxcui, spl_id, spl_set_id, substance_name, unii. ' +
          'products: active_ingredients.name, active_ingredients.strength, dosage_form, marketing_status, product_number, reference_drug, reference_standard, route, te_code. ' +
          'submissions: application_docs, review_priority, submission_class_code, submission_class_code_description, submission_number, submission_property_type.code, submission_public_notes, submission_status, submission_status_date, submission_type. ' +
          'application_docs: applications_doc_id, applications_doc_date, application_docs_title, applications_doc_type, applications_doc_url'
      ),
    searchValue: z
      .string()
      .describe('Value to search for in the specified field'),
  }),
  async handler({
    sectionName,
    fieldName,
    searchValue,
  }: {
    sectionName: string;
    fieldName: string;
    searchValue: string;
  }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('drugsfda')
      .search(`"${fieldName}":"${searchValue}"`)
      .limit(1)
      .build();

    const { data, error } = await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      let errorMessage = `Failed to retrieve drugsfda data for "${searchValue}" in ${sectionName}.${fieldName}: ${error.message}`;

      switch (error.type) {
        case 'http':
          if (error.status === 404) {
            errorMessage += `\n\nSuggestions:\n- Verify the field name is correct for the section\n- Check the search value spelling`;
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

    if (!data?.results || data.results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No drugsfda data found for "${searchValue}" in ${sectionName}.${fieldName}. Please verify the search parameters.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `drugsfda data retrieved successfully:\n\n${JSON.stringify(data.results[0], null, 2)}`,
        },
      ],
    };
  },
};
