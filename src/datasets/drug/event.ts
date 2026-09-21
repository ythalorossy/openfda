/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { z } from 'zod';
import type { EndpointDescriptor } from '../../core/descriptor.js';
import type { Clause } from '../../core/search/strategy.js';
import { EVENT_SEARCH_FIELDS } from '../../drug/event-search.js';
import {
  describeOutcome,
  SERIOUSNESS,
  PATIENT_SEX,
  REACTION_OUTCOMES,
} from './faers.js';

const MAX_REACTIONS = 3;

interface ReactionPair {
  reaction: string;
  outcome: unknown;
}

/**
 * Raw FAERS records repeat the same (reaction, outcome) pair within one
 * report, which reads as two distinct events. `reactions` and `outcomes`
 * must stay positionally aligned, so dedupe on the PAIR — not each array
 * independently — and derive both outputs from the same deduped list. The
 * same reaction with a different outcome code is two genuine data points
 * and must survive as two.
 */
function dedupeReactionPairs(reactionList: unknown): ReactionPair[] {
  const seen = new Set<string>();
  const pairs: ReactionPair[] = [];
  for (const entry of Array.isArray(reactionList) ? reactionList : []) {
    const reaction = (entry as Record<string, unknown>)?.reactionmeddrapt;
    if (!reaction) continue;
    const outcome = (entry as Record<string, unknown>)?.reactionoutcome;
    const key = `${String(reaction)}\u0000${String(outcome)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ reaction: String(reaction), outcome });
  }
  return pairs.slice(0, MAX_REACTIONS);
}

export const drugEvent: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'event',
  toolName: 'drug-event',
  summary:
    'Search FAERS adverse event reports — voluntarily submitted reports of side effects. A ' +
    'report is not evidence the drug caused the effect, and report counts reflect reporting ' +
    'behaviour as much as incidence.',
  // Descriptions here are short usage guidance for a model choosing a field
  // (rendered in the `field` parameter's own .describe(), see registry.ts),
  // not the field-selection note's "why exposed" rationale — that inflated
  // the schema budget by 60% on drug-label and was corrected there.
  fields: [
    {
      name: 'drug_name',
      description: 'brand, generic, or substance name',
      // Measured for citalopram: medicinalproduct 113,881; generic_name
      // 136,043; the union of all three 143,346. The union beats every
      // single field, so this is an anyOf rather than a tiered fallback —
      // a fallback would match medicinalproduct first and never reach the
      // better index. Paths are patient.drug.openfda.*, NOT top-level
      // openfda.*: verified live, openfda.substance_name is NOT_FOUND on
      // this index while patient.drug.openfda.substance_name returns
      // 508,117 records for IBUPROFEN.
      strategy: { kind: 'anyOf', paths: [...EVENT_SEARCH_FIELDS] },
    },
    {
      name: 'brand_name',
      description: 'proprietary (brand) name',
      strategy: { kind: 'exact', path: 'patient.drug.openfda.brand_name' },
    },
    {
      name: 'manufacturer_name',
      description: 'labeler/manufacturer name',
      strategy: {
        kind: 'exact',
        path: 'patient.drug.openfda.manufacturer_name',
      },
    },
    {
      name: 'product_ndc',
      description: 'product NDC',
      strategy: { kind: 'exact', path: 'patient.drug.openfda.product_ndc' },
    },
    {
      name: 'pharm_class',
      description: 'established pharmacologic class',
      strategy: {
        kind: 'exact',
        path: 'patient.drug.openfda.pharm_class_epc',
      },
    },
    {
      name: 'drug_characterization',
      description: 'suspect, concomitant, or interacting',
      strategy: { kind: 'exact', path: 'patient.drug.drugcharacterization' },
    },
    {
      name: 'indication',
      description: 'why the drug was given',
      strategy: { kind: 'exact', path: 'patient.drug.drugindication' },
    },
    {
      name: 'reaction',
      description: 'MedDRA reaction term, e.g. NAUSEA',
      strategy: { kind: 'exact', path: 'patient.reaction.reactionmeddrapt' },
    },
    {
      name: 'reaction_outcome',
      description: 'coded reaction outcome',
      strategy: { kind: 'exact', path: 'patient.reaction.reactionoutcome' },
    },
    {
      name: 'serious',
      description: 'coded report seriousness (1/2)',
      strategy: { kind: 'exact', path: 'serious' },
    },
    {
      name: 'seriousness_death',
      description: 'fatal-outcome flag, present if flagged',
      strategy: { kind: 'exact', path: 'seriousnessdeath' },
    },
    {
      name: 'patient_sex',
      description: 'coded patient sex',
      strategy: { kind: 'exact', path: 'patient.patientsex' },
    },
    {
      name: 'reporter_qualification',
      description: 'coded reporter type',
      strategy: { kind: 'exact', path: 'primarysource.qualification' },
    },
    {
      name: 'country',
      description: 'two-letter event country code',
      strategy: { kind: 'exact', path: 'occurcountry' },
    },
    {
      name: 'received_date',
      description: 'date FDA received the report',
      strategy: { kind: 'exact', path: 'receivedate' },
    },
    {
      name: 'report_id',
      description: "this report's own ID",
      strategy: { kind: 'exact', path: 'safetyreportid' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description:
        'One row per report with decoded codes and deduplicated reaction/outcome pairs.',
      returnsFields: [
        'report_id',
        'serious',
        'patient_age',
        'patient_sex',
        'reactions',
        'outcomes',
        'report_date',
      ],
      project: (record: any) => {
        const pairs = dedupeReactionPairs(record?.patient?.reaction);
        return {
          report_id: record?.safetyreportid ?? null,
          serious: SERIOUSNESS[String(record?.serious)] ?? 'Not reported',
          patient_age: record?.patient?.patientonsetage ?? null,
          patient_sex:
            PATIENT_SEX[String(record?.patient?.patientsex)] ?? 'Not reported',
          reactions: pairs.map((pair) => pair.reaction),
          outcomes: pairs.map((pair) => describeOutcome(pair.outcome)),
          report_date: record?.receiptdate ?? null,
        };
      },
    },
    {
      name: 'full',
      description: 'The raw upstream report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  extraFilters: {
    schema: {
      seriousness: z
        .enum(['serious', 'non-serious', 'all'])
        .optional()
        .default('all')
        .describe('Filter by event seriousness.'),
    },
    toClauses: (input): Clause[] => {
      if (input.seriousness === 'serious')
        return [{ path: 'serious', value: '1' }];
      if (input.seriousness === 'non-serious')
        return [{ path: 'serious', value: '2' }];
      return [];
    },
  },
  sortFields: ['receivedate:desc', 'receivedate:asc'],
  countFields: [
    'patient.reaction.reactionmeddrapt.exact',
    'patient.reaction.reactionoutcome',
    'serious',
    'patient.patientsex',
    'occurcountry.exact',
    'patient.drug.openfda.generic_name.exact',
  ],
  codeMaps: {
    serious: SERIOUSNESS,
    'patient.patientsex': PATIENT_SEX,
    'patient.reaction.reactionoutcome': REACTION_OUTCOMES,
  },
  limits: { default: 10, max: 50 },
  catalog: 'src/catalog/drug-event.json',
};
