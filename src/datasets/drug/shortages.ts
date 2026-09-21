/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/** openFDA sends an empty string for an absent date on this endpoint; null is honest. */
const orNull = (value: unknown): unknown =>
  value === '' || value == null ? null : value;

/**
 * The 13 paths selected in docs/superpowers/notes/2026-09-20-field-selection.md
 * (`## shortages`). `openfda.generic_name` was seeded by the plan but is
 * absent from FDA's own published field reference (drugshortages.yaml) and
 * so fails the catalog-conformance guard; the top-level `generic_name`
 * (100% populated) already covers the generic-name search it would have
 * answered. `openfda.substance_name`, `openfda.product_ndc` and
 * `update_date` were added.
 */
const PATHS: Array<[name: string, description: string]> = [
  ['generic_name', 'drug name as recorded in shortage'],
  ['company_name', 'firm reporting the shortage'],
  ['openfda.manufacturer_name', 'normalised labeler name; sparse ~90%'],
  ['openfda.brand_name', 'proprietary name; sparse ~90%'],
  ['openfda.substance_name', 'active moiety; sparse ~89%'],
  ['package_ndc', 'package NDC of the affected presentation'],
  ['openfda.product_ndc', 'product NDC; sparse ~90%'],
  ['presentation', 'specific affected package or strength'],
  ['status', 'Shortage / Resolved / Discontinued'],
  ['therapeutic_category', 'clinical category, e.g. Anti-Infective'],
  ['dosage_form', 'e.g. ORAL SUSPENSION, INJECTION'],
  ['update_type', 'kind of change this record represents'],
  ['initial_posting_date', 'when the shortage was first reported'],
  ['update_date', 'when the record was last changed'],
];

const fields: FieldSpec[] = PATHS.map(([name, description]) => ({
  name,
  description,
  strategy: { kind: 'exact' as const, path: name },
}));

function summarise(record: any): Record<string, unknown> {
  return {
    generic_name: orNull(record?.generic_name),
    company_name: orNull(record?.company_name),
    status: orNull(record?.status),
    dosage_form: orNull(record?.dosage_form),
    therapeutic_category: asArray(record?.therapeutic_category),
    package_ndc: orNull(record?.package_ndc),
    presentation: orNull(record?.presentation),
    update_type: orNull(record?.update_type),
    initial_posting_date: orNull(record?.initial_posting_date),
    update_date: orNull(record?.update_date),
    // Not a selected search field (only 27.64% populated), but the
    // fixed-empty-string-date quirk applies to it exactly as much as the
    // two dates above, so it is normalised the same way when present.
    discontinued_date: orNull(record?.discontinued_date),
    // Sparse (~89%) but exact; bundled as one object rather than four keys,
    // matching drug-drugsfda's and drug-enforcement's thin openfda blocks.
    openfda: record?.openfda ?? {},
  };
}

export const drugShortages: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'shortages',
  toolName: 'drug-shortages',
  summary:
    'Search FDA drug shortage reports. status distinguishes a current shortage from a resolved ' +
    'one, so a product appearing here is not necessarily short now — always read status and ' +
    'update_date. openFDA sends an empty string, not null, for an absent date on this endpoint; ' +
    'this tool normalises those to null. Smallest drug dataset (~1,600 records), so a coverage ' +
    'percentage here represents far fewer records than the same percentage elsewhere.',
  fields,
  defaultField: 'generic_name',
  projections: [
    {
      name: 'summary',
      description:
        'The affected presentation, who reports it, its status and the relevant dates.',
      returnsFields: [
        'generic_name',
        'company_name',
        'status',
        'dosage_form',
        'therapeutic_category',
        'package_ndc',
        'presentation',
        'update_type',
        'initial_posting_date',
        'update_date',
        'discontinued_date',
        'openfda',
      ],
      project: summarise,
    },
    {
      name: 'full',
      description: 'The raw upstream shortage report under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: [
    'update_date:desc',
    'update_date:asc',
    'initial_posting_date:desc',
  ],
  countFields: [
    'status',
    'dosage_form.exact',
    'therapeutic_category',
    'company_name.exact',
  ],
  codeMaps: {},
  limits: { default: 10, max: 50 },
  catalog: 'src/catalog/drug-shortages.json',
};
