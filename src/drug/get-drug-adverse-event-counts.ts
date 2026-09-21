/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { buildEventSearch, EVENT_MATCHED_VIA } from './event-search.js';
import { describeCountTerm } from '../datasets/drug/faers.js';

/**
 * Fields verified to aggregate against the live API. `receivedate` is
 * excluded deliberately: counting it returns `term: undefined`.
 */
const COUNTABLE_FIELDS = [
  'patient.reaction.reactionmeddrapt.exact',
  'patient.reaction.reactionoutcome',
  'serious',
  'patient.patientsex',
  'occurcountry.exact',
  'patient.drug.openfda.generic_name.exact',
] as const;

interface CountTerm {
  // openFDA sends coded fields (e.g. serious, patient.patientsex) as
  // NUMBERS, not strings, and text fields as strings.
  term: string | number;
  count: number;
}

export const getDrugAdverseEventCounts = {
  name: 'get-drug-adverse-event-counts',
  description:
    'Rank adverse-event values for a drug by frequency — for example the most commonly reported reactions. Returns aggregated {term, term_code, count} pairs as results, not individual reports, along with matched_via, counted_by (the field that was aggregated) and returned (how many ranked terms came back). For coded fields (serious, patient.patientsex, patient.reaction.reactionoutcome), term is a decoded human-readable label (e.g. "Serious", "Female") and term_code is the raw upstream value; for text fields term and term_code are identical. Note that openFDA omits a result total on aggregated responses, so this tool reports no total; use get-drug-adverse-events for individual reports and their total.',
  // Raw upstream records wrapped in an envelope: declare only the envelope
  // keys this tool guarantees (matched_via, counted_by, returned, results),
  // never inner record fields, because those vary per record. There is no
  // `total` or `limit` here — openFDA omits a total on aggregated
  // responses, so this tool deliberately does not declare one.
  returnsFields: ['matched_via', 'counted_by', 'returned', 'results'] as const,
  inputSchema: z.object({
    drugName: z.string().describe('Drug name (brand, generic or substance)'),
    field: z
      .enum(COUNTABLE_FIELDS)
      .optional()
      .default('patient.reaction.reactionmeddrapt.exact')
      .describe('Field to aggregate by'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe('Maximum number of ranked terms to return'),
  }),
  async handler({
    drugName,
    field,
    limit,
  }: {
    drugName: string;
    field?: (typeof COUNTABLE_FIELDS)[number];
    limit?: number;
  }) {
    const countField = field ?? 'patient.reaction.reactionmeddrapt.exact';
    const max = limit ?? 10;

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(buildEventSearch(drugName))
      .count(countField)
      .limit(max)
      .build();

    const { data, error } = await makeOpenFDARequest<{
      results?: CountTerm[];
    }>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Failed to retrieve adverse event counts for "${drugName}": ${error.message}`,
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
            text: `No adverse event counts found for "${drugName}".`,
          },
        ],
      };
    }

    const payload = {
      matched_via: EVENT_MATCHED_VIA,
      counted_by: countField,
      returned: data.results.length,
      // Decode coded enums; text fields pass through. term_code keeps the
      // raw value so callers aggregating by code are unaffected.
      results: data.results.map((row) => ({
        term: describeCountTerm(countField, row.term),
        term_code: row.term,
        count: row.count,
      })),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Top ${data.results.length} values of ${countField} for "${drugName}" (aggregated responses carry no result total)\n\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    };
  },
};
