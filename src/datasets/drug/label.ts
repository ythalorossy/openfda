/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor } from '../../core/descriptor.js';
import type { ClauseSet, StrategyError } from '../../core/search/strategy.js';
import { normalizeNDC } from '../../utils/ndc.js';
import { invalidNdcMessage } from '../../utils/ndc-formats.js';
import {
  mapLabelFields,
  mapSafetyFields,
  resolveGenericName,
} from './label-fields.js';

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/**
 * Exact brand search alone misses real originator brands: Cordarone and
 * Glucophage are absent from openfda.brand_name but present in the label's own
 * spl_product_data_elements. Tiers are separate sequential queries rather than
 * one OR so relevance ordering stays predictable.
 */
const NAME_TIERS = [
  'openfda.brand_name',
  'openfda.generic_name',
  'openfda.substance_name',
  'spl_product_data_elements',
];

/** A package NDC must also match the product it belongs to, so both are ORed. */
function ndcClauses(raw: string): ClauseSet | StrategyError {
  const { productNDC, packageNDC, isValid } = normalizeNDC(raw);
  if (!isValid) return { ok: false, message: invalidNdcMessage(raw, 'NDC') };
  const clauses = [{ path: 'openfda.product_ndc', value: productNDC }];
  if (packageNDC)
    clauses.push({ path: 'openfda.package_ndc', value: packageNDC });
  return {
    clauses,
    op: 'OR',
    matched_via: packageNDC
      ? 'openfda.product_ndc OR openfda.package_ndc'
      : 'openfda.product_ndc',
  };
}

const identity = (record: any): Record<string, unknown> => ({
  // substance_name first: the top match for a brand is often a combination
  // product, and that must be obvious without reading the whole record.
  substance_name: asArray(record?.openfda?.substance_name),
  brand_name: asArray(record?.openfda?.brand_name),
  generic_name: asArray(record?.openfda?.generic_name),
  manufacturer_name: asArray(record?.openfda?.manufacturer_name),
  product_ndc: asArray(record?.openfda?.product_ndc),
  package_ndc: asArray(record?.openfda?.package_ndc),
  product_type: asArray(record?.openfda?.product_type),
  route: asArray(record?.openfda?.route),
});

export const drugLabel: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'label',
  toolName: 'drug-label',
  summary:
    'Search FDA structured product labels (SPL) — prescribing and OTC drug info. route here is ' +
    "the SPL route vocabulary, different from drug-drugsfda's products[].route (e.g. " +
    'SUBCUTANEOUS vs INJECTION) — do not join across tools on route.',
  // Descriptions here are deliberately short: this is usage guidance for a
  // model choosing a field (rendered once, in the `field` parameter's own
  // .describe() — see registry.ts), not the selection rationale. That
  // rationale lives in docs/superpowers/notes/2026-09-20-field-selection.md
  // and, from Task 25, in the field-catalog resource, which costs nothing
  // until read. A short phrase survives here only when it disambiguates
  // something a model would otherwise get wrong (e.g. route's vocabulary).
  fields: [
    {
      name: 'drug_name',
      description: 'brand, generic, or substance name',
      strategy: { kind: 'tiered', paths: NAME_TIERS },
    },
    {
      name: 'ndc',
      description: 'product or package NDC',
      strategy: {
        kind: 'clauses',
        paths: ['openfda.product_ndc', 'openfda.package_ndc'],
        build: ndcClauses,
      },
    },
    {
      name: 'spl_product_data_elements',
      description: 'free-text SPL product elements',
      strategy: { kind: 'exact', path: 'spl_product_data_elements' },
    },
    {
      name: 'effective_time',
      description: 'SPL version/revision date',
      strategy: { kind: 'exact', path: 'effective_time' },
    },
    {
      name: 'id',
      description: "this label version's ID",
      strategy: { kind: 'exact', path: 'id' },
    },
    {
      name: 'set_id',
      description: 'stable SPL id across revisions',
      strategy: { kind: 'exact', path: 'set_id' },
    },
    {
      name: 'brand_name',
      description: 'proprietary (brand) name',
      strategy: { kind: 'exact', path: 'openfda.brand_name' },
    },
    {
      name: 'generic_name',
      description: 'non-proprietary name',
      strategy: { kind: 'exact', path: 'openfda.generic_name' },
    },
    {
      name: 'substance_name',
      description: 'active ingredient name',
      strategy: { kind: 'exact', path: 'openfda.substance_name' },
    },
    {
      name: 'manufacturer_name',
      description: 'labeler/manufacturer name',
      strategy: { kind: 'exact', path: 'openfda.manufacturer_name' },
    },
    {
      name: 'route',
      // Worth the characters: this is the SPL route vocabulary, which
      // differs from drug-drugsfda's products[].route (see summary).
      description: 'SPL route of administration',
      strategy: { kind: 'exact', path: 'openfda.route' },
    },
    {
      name: 'product_type',
      description: 'OTC vs prescription drug',
      strategy: { kind: 'exact', path: 'openfda.product_type' },
    },
    {
      name: 'application_number',
      description: 'NDA/ANDA/BLA number',
      strategy: { kind: 'exact', path: 'openfda.application_number' },
    },
    {
      name: 'unii',
      description: 'FDA ingredient ID (UNII)',
      strategy: { kind: 'exact', path: 'openfda.unii' },
    },
    {
      name: 'rxcui',
      description: 'RxNorm concept id',
      strategy: { kind: 'exact', path: 'openfda.rxcui' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description:
        'Identity plus safety narrative; every field present, empty if absent.',
      returnsFields: [
        'substance_name',
        'brand_name',
        'generic_name',
        'manufacturer_name',
        'product_ndc',
        'package_ndc',
        'product_type',
        'route',
        'indications_and_usage',
        'boxed_warning',
        'warnings',
        'warnings_and_cautions',
        'do_not_use',
        'ask_doctor',
        'ask_doctor_or_pharmacist',
        'stop_use',
        'pregnancy_or_breast_feeding',
      ],
      project: (record: any) => ({
        ...identity(record),
        ...mapLabelFields(record as Record<string, unknown>),
      }),
    },
    {
      name: 'safety',
      description: 'Warnings, contraindications, interactions and overdosage.',
      returnsFields: [
        'brand_name',
        'generic_name',
        'boxed_warning',
        'warnings',
        'warnings_and_cautions',
        'contraindications',
        'drug_interactions',
        'precautions',
        'adverse_reactions',
        'overdosage',
        'do_not_use',
        'ask_doctor',
        'ask_doctor_or_pharmacist',
        'stop_use',
        'pregnancy_or_breast_feeding',
      ],
      project: (record: any) => ({
        brand_name: asArray(record?.openfda?.brand_name),
        // null, never "Unknown": a placeholder string is indistinguishable
        // from real data to every consumer.
        generic_name: resolveGenericName(
          (record?.openfda ?? {}) as Record<string, unknown>
        ),
        ...mapSafetyFields(record as Record<string, unknown>),
      }),
    },
    {
      name: 'full',
      description: 'Raw upstream label under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['effective_time:desc', 'effective_time:asc'],
  countFields: [
    'openfda.route',
    'openfda.product_type',
    'openfda.manufacturer_name.exact',
  ],
  codeMaps: {},
  limits: { default: 1, max: 25 },
  catalog: 'src/catalog/drug-label.json',
};
