/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { OpenFDAResponse } from '../types.js';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { summarizeResults, withTotals } from '../utils/format.js';
import { SECTIONS, SECTION_NAMES, resolveField } from './drugsfda-sections.js';

const fieldList = (section: string) =>
  `${section}: ${Object.keys(SECTIONS[section]!.fields).join(', ')}`;

export const getDrugsfda = {
  name: 'get-drugsfda',
  description:
    'Search Drugs@FDA application data by section and field. Returns application, sponsor, product and submission records. Reports how many records matched in total, not just how many were returned.',
  inputSchema: z.object({
    sectionName: z
      .enum([...SECTION_NAMES] as [string, ...string[]])
      .describe(`Section to search. One of: ${SECTION_NAMES.join(', ')}`),
    fieldName: z
      .string()
      .describe(
        `Field within the section. ${SECTION_NAMES.map(fieldList).join('. ')}`
      ),
    searchValue: z
      .string()
      .describe(
        'Value to search for. Sponsor names are stored uppercase and are normalised automatically.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(5)
      .describe('Maximum number of records to return'),
  }),
  async handler({
    sectionName,
    fieldName,
    searchValue,
    limit,
  }: {
    sectionName: string;
    fieldName: string;
    searchValue: string;
    limit?: number;
  }) {
    const max = limit ?? 5;

    // Validate before any request, so a typo is never indistinguishable from
    // genuinely absent data.
    const resolved = resolveField(sectionName, fieldName);
    if (!resolved.ok) {
      return {
        content: [{ type: 'text' as const, text: resolved.message }],
        isError: true,
      };
    }

    const value = resolved.uppercase ? searchValue.toUpperCase() : searchValue;

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('drugsfda')
      .search(`${resolved.path}:"${value}"`)
      .limit(max)
      .build();

    const { data, error } = await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to retrieve Drugs@FDA data for "${value}" in ${resolved.path}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!data?.results || data.results.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No Drugs@FDA records found for "${value}" in ${resolved.path}.`,
          },
        ],
      };
    }

    const total = data.meta?.results?.total;

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summarizeResults(data.results.length, total, `Drugs@FDA records matching ${resolved.path}`)}\n\n${JSON.stringify({ matched_via: resolved.path, ...withTotals(data.results, total, max) }, null, 2)}`,
        },
      ],
    };
  },
};
