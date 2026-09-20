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

/**
 * A single Neurontin application with 38 submissions measures 21,042
 * characters — roughly 550 per submission. Ten keeps a record near 5.5k, so
 * even `limit: 5` in full mode stays far inside the output budget that the
 * uncapped 71,393-character response blew.
 */
export const MAX_SUBMISSIONS_PER_RECORD = 10;

/** openFDA omits te_code entirely on some products; emit it either way. */
const normaliseProduct = (product: Record<string, unknown>) => ({
  ...product,
  te_code: product.te_code ?? null,
});

const shapeRecord = (
  record: Record<string, any>,
  detail: 'summary' | 'full'
) => {
  const submissions = Array.isArray(record.submissions)
    ? record.submissions
    : [];
  const products = Array.isArray(record.products) ? record.products : [];

  const base = {
    application_number: record.application_number,
    sponsor_name: record.sponsor_name,
    // openFDA omits openfda entirely on most records (43/50 for a LILLY
    // sponsor_name search); emit it either way, matching te_code above.
    openfda: record.openfda ?? {},
    products: products.map(normaliseProduct),
    submission_count: submissions.length,
  };

  if (detail === 'summary') return base;

  return {
    ...base,
    submissions: submissions.slice(0, MAX_SUBMISSIONS_PER_RECORD),
    submissions_truncated: submissions.length > MAX_SUBMISSIONS_PER_RECORD,
  };
};

export const getDrugsfda = {
  name: 'get-drugsfda',
  description:
    'Search Drugs@FDA application data by section and field. Returns application, sponsor, product and submission records as results, up to limit. Reports matched_via (the resolved field path), the total number of records matched, and returned, the number actually sent back. detail controls record shape: summary (default) returns application_number, sponsor_name, openfda, products and a submission_count; full adds the submissions array, capped at 10 per record, plus submissions_truncated when more were omitted. This default changed in 1.3.0: submissions is no longer returned unless detail is set to full. Note: openfda.route is the SPL route of administration and products[].route is the Drugs@FDA product route. They use different controlled vocabularies — the same product can be SUBCUTANEOUS in one and INJECTION in the other — so joining on route across tools will silently miss.',
  // Raw upstream records wrapped in an envelope: declare only the envelope
  // keys this tool guarantees (matched_via, total, returned, limit,
  // results), never inner record fields, because those vary per record.
  returnsFields: [
    'matched_via',
    'total',
    'returned',
    'limit',
    'results',
  ] as const,
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
    detail: z
      .enum(['summary', 'full'])
      .optional()
      .default('summary')
      .describe(
        'summary (default) returns application number, sponsor, products and a submission count. full adds the submissions array, capped per record.'
      ),
  }),
  async handler({
    sectionName,
    fieldName,
    searchValue,
    limit,
    detail,
  }: {
    sectionName: string;
    fieldName: string;
    searchValue: string;
    limit?: number;
    detail?: 'summary' | 'full';
  }) {
    const max = limit ?? 5;
    const mode = detail ?? 'summary';

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
    const shaped = data.results.map((r) =>
      shapeRecord(r as unknown as Record<string, any>, mode)
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `${summarizeResults(data.results.length, total, `Drugs@FDA records matching ${resolved.path}`)}\n\n${JSON.stringify({ matched_via: resolved.path, ...withTotals(shaped, total, max) }, null, 2)}`,
        },
      ],
    };
  },
};
