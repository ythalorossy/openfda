/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import z from 'zod';

export const getDrugAdverseEvents = {
  name: 'get-drug-adverse-events',
  description:
    'Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug name (brand or generic)'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of events to return'),
    seriousness: z
      .enum(['serious', 'non-serious', 'all'])
      .optional()
      .default('all')
      .describe('Filter by event seriousness'),
  }),
  async handler({
    drugName,
    limit,
    seriousness,
  }: {
    drugName: string;
    limit?: number;
    seriousness?: 'serious' | 'non-serious' | 'all';
  }) {
    let searchQuery = `patient.drug.medicinalproduct:"${drugName}"`;

    if (seriousness !== 'all') {
      const serious = seriousness === 'serious' ? '1' : '2';
      searchQuery += `+AND+serious:${serious}`;
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(searchQuery)
      .limit(limit)
      .build();

    const { data: eventData, error } = await makeOpenFDARequest<any>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve adverse events for "${drugName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!eventData?.results || eventData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No adverse events found for "${drugName}".`,
          },
        ],
      };
    }

    const events = eventData.results.map((event: any) => ({
      report_id: event.safetyreportid,
      serious: event.serious === '1' ? 'Yes' : 'No',
      patient_age: event.patient?.patientonsetage || 'Unknown',
      patient_sex:
        event.patient?.patientsex === '1'
          ? 'Male'
          : event.patient?.patientsex === '2'
            ? 'Female'
            : 'Unknown',
      reactions:
        event.patient?.reaction
          ?.map((r: any) => r.reactionmeddrapt)
          .slice(0, 3) || [],
      outcomes:
        event.patient?.reaction
          ?.map((r: any) => r.reactionoutcome)
          .slice(0, 3) || [],
      report_date: event.receiptdate || 'Unknown',
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${events.length} adverse event report(s) for "${drugName}":\n\n${JSON.stringify(events, null, 2)}`,
        },
      ],
    };
  },
};
