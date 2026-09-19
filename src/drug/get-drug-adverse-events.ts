/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { summarizeResults, withTotals } from '../utils/format.js';
import { describeOutcome } from './faers.js';
import { buildEventSearch, EVENT_MATCHED_VIA } from './event-search.js';
import z from 'zod';

interface ReactionPair {
  reaction: string;
  outcome: unknown;
}

/**
 * Raw FAERS records repeat the same (reaction, outcome) pair within one
 * report, which reads as two distinct events. `reactions` and `outcomes`
 * must stay positionally aligned, so dedupe on the PAIR (not each array
 * independently) before truncating, and derive both output arrays from the
 * same deduped pairs. A same reaction term with a different outcome code is
 * two genuine data points and must survive as two entries.
 */
function dedupeReactionPairs(reactionList: any[]): ReactionPair[] {
  const seen = new Set<string>();
  const pairs: ReactionPair[] = [];
  for (const r of reactionList) {
    const reaction = r?.reactionmeddrapt;
    if (!reaction) continue;
    const key = `${reaction}\u0000${String(r?.reactionoutcome)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ reaction, outcome: r?.reactionoutcome });
  }
  return pairs.slice(0, 3);
}

/** openFDA rejects skip above this: "Skip value must 25000 or less." */
export const SKIP_MAX = 25000;

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
    skip: z
      .number()
      .int()
      .min(0)
      .max(SKIP_MAX)
      .optional()
      .describe(
        `Offset into the result set, for paging past the limit. Maximum ${SKIP_MAX}.`
      ),
    sort: z
      .enum(['receivedate:desc', 'receivedate:asc'])
      .optional()
      .describe(
        'Order results by report receive date. Without it, results are a deterministic earliest-report_id slice, so a small sample is not representative.'
      ),
  }),
  async handler({
    drugName,
    limit,
    seriousness,
    skip,
    sort,
  }: {
    drugName: string;
    limit?: number;
    seriousness?: 'serious' | 'non-serious' | 'all';
    skip?: number;
    sort?: 'receivedate:desc' | 'receivedate:asc';
  }) {
    // Validate locally rather than forwarding a request openFDA will reject
    // with an opaque BAD_REQUEST.
    if (skip !== undefined && skip > SKIP_MAX) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `skip must be ${SKIP_MAX} or less (openFDA's ceiling); received ${skip}. To reach records beyond that, narrow the search or use sort to bring the records you want into range.`,
          },
        ],
        isError: true,
      };
    }

    let searchQuery = buildEventSearch(drugName);

    if (seriousness !== 'all') {
      const serious = seriousness === 'serious' ? '1' : '2';
      // Parenthesise the OR group: without it, `a OR b OR c AND serious:1`
      // binds the AND to the last term only and the filter silently applies
      // to one index instead of all three.
      searchQuery = `(${searchQuery}) AND serious:${serious}`;
    }

    const builder = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(searchQuery)
      .limit(limit);

    if (skip !== undefined) builder.skip(skip);
    if (sort !== undefined) builder.sort(sort);

    const url = builder.build();

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

    const events = eventData.results.map((event: any) => {
      const pairs = dedupeReactionPairs(event.patient?.reaction ?? []);
      return {
        report_id: event.safetyreportid,
        serious: event.serious === '1' ? 'Yes' : 'No',
        patient_age: event.patient?.patientonsetage || 'Unknown',
        patient_sex:
          event.patient?.patientsex === '1'
            ? 'Male'
            : event.patient?.patientsex === '2'
              ? 'Female'
              : 'Unknown',
        // Derived from the same deduped pairs so the two arrays stay the
        // same length and positionally aligned (see dedupeReactionPairs).
        reactions: pairs.map((p) => p.reaction),
        outcomes: pairs.map((p) => describeOutcome(p.outcome)),
        report_date: event.receiptdate || 'Unknown',
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: `${summarizeResults(events.length, eventData.meta?.results?.total, `adverse event reports for "${drugName}"`)}\n\n${JSON.stringify({ matched_via: EVENT_MATCHED_VIA, ...withTotals(events, eventData.meta?.results?.total, limit ?? 10) }, null, 2)}`,
        },
      ],
    };
  },
};
