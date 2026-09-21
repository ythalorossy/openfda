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
    'Search FDA structured product labels (SPL) — prescribing and OTC drug information. ' +
    'openfda.* fields cover roughly a third of labels; route here is the SPL route of ' +
    'administration, a different vocabulary from drug-drugsfda products[].route (the same ' +
    'insulin can be SUBCUTANEOUS here and INJECTION there) — do not join on route across tools.',
  fields: [
    {
      name: 'drug_name',
      description:
        'brand, generic or substance name, tried in that order, falling back to ' +
        'spl_product_data_elements — reaches labels with no structured openfda block',
      strategy: { kind: 'tiered', paths: NAME_TIERS },
    },
    {
      name: 'ndc',
      description:
        'product or package NDC — joins to drug-ndc and drug-shortages; a package NDC also ' +
        'matches its product. Dashed 4-4, 5-3, 5-4, or undashed 9 or 11 digits',
      strategy: {
        kind: 'clauses',
        paths: ['openfda.product_ndc', 'openfda.package_ndc'],
        build: ndcClauses,
      },
    },
    {
      name: 'spl_product_data_elements',
      description:
        'free-text product elements (99.89% coverage) — the last-resort tier of the name resolver ' +
        'and the one search that reaches essentially the whole corpus',
      strategy: { kind: 'exact', path: 'spl_product_data_elements' },
    },
    {
      name: 'effective_time',
      description:
        'the SPL version date (100% coverage) — the only way to ask "labels revised since …"',
      strategy: { kind: 'exact', path: 'effective_time' },
    },
    {
      name: 'id',
      description:
        'primary key of one specific label version (100% coverage) — lets an agent re-fetch the ' +
        'exact record it was handed',
      strategy: { kind: 'exact', path: 'id' },
    },
    {
      name: 'set_id',
      description:
        'the SPL identifier stable across label revisions (100% coverage) — the join key from ' +
        'drug-ndc (openfda.spl_set_id) into this endpoint',
      strategy: { kind: 'exact', path: 'set_id' },
    },
    {
      name: 'brand_name',
      description:
        'the proprietary name, and the first tier of the name resolver; precise when present',
      strategy: { kind: 'exact', path: 'openfda.brand_name' },
    },
    {
      name: 'generic_name',
      description:
        'the non-proprietary product name; second tier of the resolver',
      strategy: { kind: 'exact', path: 'openfda.generic_name' },
    },
    {
      name: 'substance_name',
      description:
        'the active moiety, listed per ingredient, so a combination product is findable by any ' +
        'one of its substances; third tier of the resolver',
      strategy: { kind: 'exact', path: 'openfda.substance_name' },
    },
    {
      name: 'manufacturer_name',
      description:
        'the labeler; the only company-name search this endpoint has',
      strategy: { kind: 'exact', path: 'openfda.manufacturer_name' },
    },
    {
      name: 'route',
      description:
        'route of administration (ORAL, TOPICAL, …); a small controlled vocabulary that usefully ' +
        'narrows a name search',
      strategy: { kind: 'exact', path: 'openfda.route' },
    },
    {
      name: 'product_type',
      description:
        'OTC vs prescription; a two-value split that halves the corpus and is a common qualifier',
      strategy: { kind: 'exact', path: 'openfda.product_type' },
    },
    {
      name: 'application_number',
      description:
        'NDA/ANDA/BLA number; the join key from drug-drugsfda and drug-orangebook back to the label',
      strategy: { kind: 'exact', path: 'openfda.application_number' },
    },
    {
      name: 'unii',
      description:
        "FDA's unique ingredient identifier — unambiguous substance search where a name is " +
        'ambiguous or spelled inconsistently',
      strategy: { kind: 'exact', path: 'openfda.unii' },
    },
    {
      name: 'rxcui',
      description:
        'RxNorm concept id; the identifier a clinical system will already be holding, so it makes ' +
        "this tool reachable from outside FDA's own naming",
      strategy: { kind: 'exact', path: 'openfda.rxcui' },
    },
  ],
  defaultField: 'drug_name',
  projections: [
    {
      name: 'summary',
      description:
        'Identity fields plus the safety narrative; every field present, empty when absent.',
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
      description:
        'The raw upstream label under `record`, for fields the projections omit.',
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
