/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';

/**
 * The 17 paths selected in docs/superpowers/notes/2026-09-20-field-selection.md
 * (`## enforcement`). `product_type` was seeded by the plan but rejected: FDA's
 * own field description says it is always `"Drugs"` on this endpoint, so it can
 * never narrow a result. `event_id`, `code_info` and `termination_date` were
 * added (sibling-recall lookup, lot-number lookup and a closing date), plus the
 * three `openfda.*` names as the precise, non-default complement to
 * `product_description` — see the descriptor summary below.
 */
const PATHS: Array<[name: string, description: string]> = [
  ['product_description', 'recalled product, free text (default)'],
  ['recall_number', 'FDA recall number, e.g. D-0001-2024'],
  ['event_id', 'recall event id; finds sibling recalls'],
  ['code_info', 'lot/serial/expiry codes on the product'],
  ['recalling_firm', 'company conducting the recall'],
  ['reason_for_recall', 'why it was recalled, free text'],
  ['classification', 'hazard class: I, II or III'],
  ['status', 'Ongoing, Completed or Terminated'],
  ['voluntary_mandated', 'firm-initiated or FDA-mandated'],
  ['state', "recalling firm's US state"],
  ['country', "recalling firm's country"],
  ['recall_initiation_date', 'date the firm began the recall'],
  ['report_date', 'date FDA published the recall'],
  ['termination_date', 'date the recall closed, if closed'],
  ['openfda.generic_name', 'generic name; exact but sparse (~18%)'],
  ['openfda.brand_name', 'brand name; exact but sparse (~18%)'],
  ['openfda.product_ndc', 'product NDC; exact but sparse (~18%)'],
];

const fields: FieldSpec[] = PATHS.map(([name, description]) => ({
  name,
  description,
  strategy: { kind: 'exact' as const, path: name },
}));

function summarise(record: any): Record<string, unknown> {
  return {
    recall_number: record?.recall_number ?? null,
    event_id: record?.event_id ?? null,
    product_description: record?.product_description ?? null,
    code_info: record?.code_info ?? null,
    recalling_firm: record?.recalling_firm ?? null,
    reason_for_recall: record?.reason_for_recall ?? null,
    classification: record?.classification ?? null,
    status: record?.status ?? null,
    voluntary_mandated: record?.voluntary_mandated ?? null,
    state: record?.state ?? null,
    country: record?.country ?? null,
    recall_initiation_date: record?.recall_initiation_date ?? null,
    report_date: record?.report_date ?? null,
    // Absent while a recall is still open; null means "not terminated",
    // which is different from "we did not look".
    termination_date: record?.termination_date ?? null,
    // Only ~18% of recalls carry this block; bundled as one object rather
    // than three separate keys, matching drug-drugsfda's thin openfda block.
    openfda: record?.openfda ?? {},
  };
}

export const drugEnforcement: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'enforcement',
  toolName: 'drug-enforcement',
  summary:
    'Search FDA drug recall and enforcement reports. classification is the hazard level ' +
    '(Class I: reasonable probability of serious harm or death; II: temporary or reversible ' +
    'harm; III: unlikely harm), and status shows whether a recall is Ongoing, Completed or ' +
    'Terminated — a recall appearing in results does not mean it is still in effect. ' +
    'product_description is the default drug-name search, 100% populated; the openfda names ' +
    'are the precise but sparse (~18%) alternative.',
  fields,
  defaultField: 'product_description',
  projections: [
    {
      name: 'summary',
      description:
        'The recall, its hazard classification and status, reason, scope and dates.',
      returnsFields: [
        'recall_number',
        'event_id',
        'product_description',
        'code_info',
        'recalling_firm',
        'reason_for_recall',
        'classification',
        'status',
        'voluntary_mandated',
        'state',
        'country',
        'recall_initiation_date',
        'report_date',
        'termination_date',
        'openfda',
      ],
      project: summarise,
    },
    {
      name: 'full',
      description: 'The raw upstream enforcement report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: [
    'report_date:desc',
    'report_date:asc',
    'recall_initiation_date:desc',
  ],
  countFields: [
    'classification',
    'status',
    'state',
    'voluntary_mandated',
    'recalling_firm.exact',
  ],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-enforcement.json',
};
