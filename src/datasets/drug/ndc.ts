/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';
import { normalizeNDC } from '../../utils/ndc.js';
import { invalidNdcMessage } from '../../utils/ndc-formats.js';

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * The 16 paths selected in docs/superpowers/notes/2026-09-20-field-selection.md
 * (`## ndc`). `labeler_name` was seeded by the plan but is absent from FDA's
 * own published field reference (drugndc.yaml) and so fails the catalog-
 * conformance guard; `openfda.manufacturer_name` answers the same
 * "which company" question and is exposed in its place. Field names are the
 * query path itself, matching drug-drugsfda's convention, except
 * `product_ndc`, which needs a normalizer.
 */
const PATHS: Array<[name: string, description: string]> = [
  ['packaging.package_ndc', 'package NDC printed on the carton'],
  ['generic_name', 'non-proprietary drug name'],
  ['brand_name', 'proprietary (brand) name'],
  ['active_ingredients.name', 'active ingredient name'],
  ['openfda.manufacturer_name', 'labeler/manufacturer name'],
  ['marketing_category', 'e.g. NDA, ANDA, OTC MONOGRAPH FINAL'],
  ['application_number', 'NDA/ANDA/BLA number'],
  ['dosage_form', 'e.g. TABLET, INJECTION'],
  ['route', 'route of administration'],
  ['product_type', 'OTC vs prescription vs other'],
  ['pharm_class', 'pharmacologic class'],
  ['marketing_start_date', 'date marketing began'],
  ['openfda.unii', 'FDA ingredient ID (UNII)'],
  ['openfda.rxcui', 'RxNorm concept id'],
  ['openfda.spl_set_id', 'stable SPL id; joins to drug-label'],
];

const productNdcField: FieldSpec = {
  name: 'product_ndc',
  description: 'product NDC',
  normalize: (raw) => {
    const { productNDC, isValid } = normalizeNDC(raw);
    return isValid
      ? { ok: true as const, value: productNDC }
      : { ok: false as const, message: invalidNdcMessage(raw, 'product NDC') };
  },
  strategy: { kind: 'exact', path: 'product_ndc' },
};

const fields: FieldSpec[] = [
  productNdcField,
  ...PATHS.map(([name, description]) => ({
    name,
    description,
    strategy: { kind: 'exact' as const, path: name },
  })),
];

function summarise(record: any): Record<string, unknown> {
  return {
    product_ndc: record?.product_ndc ?? null,
    brand_name: record?.brand_name ?? null,
    generic_name: record?.generic_name ?? null,
    manufacturer_name: asArray(record?.openfda?.manufacturer_name),
    dosage_form: record?.dosage_form ?? null,
    route: asArray(record?.route),
    product_type: record?.product_type ?? null,
    marketing_category: record?.marketing_category ?? null,
    application_number: record?.application_number ?? null,
    pharm_class: asArray(record?.pharm_class),
    marketing_start_date: record?.marketing_start_date ?? null,
    active_ingredients: asArray(record?.active_ingredients),
    // Flattened from packaging[]: the package NDCs are what a caller
    // actually searches by, and the rest of the packaging blob is noise.
    package_ndc: asArray(record?.packaging)
      .map((pack: any) => pack?.package_ndc)
      .filter(isString),
    unii: asArray(record?.openfda?.unii),
    rxcui: asArray(record?.openfda?.rxcui),
    spl_set_id: asArray(record?.openfda?.spl_set_id),
    finished: record?.finished ?? null,
  };
}

export const drugNdc: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'ndc',
  toolName: 'drug-ndc',
  summary:
    'Search the NDC Directory — every drug product currently listed with the FDA, with its ' +
    'packaging, labeler, marketing category and application number. This is the PRODUCT ' +
    'REGISTRY, not labelling text or approval history: use drug-label for warnings and ' +
    'indications, drug-drugsfda for approvals and submissions.',
  fields,
  defaultField: 'generic_name',
  projections: [
    {
      name: 'summary',
      description:
        'Identity, packaging and marketing status for one listed product.',
      returnsFields: [
        'product_ndc',
        'brand_name',
        'generic_name',
        'manufacturer_name',
        'dosage_form',
        'route',
        'product_type',
        'marketing_category',
        'application_number',
        'pharm_class',
        'marketing_start_date',
        'active_ingredients',
        'package_ndc',
        'unii',
        'rxcui',
        'spl_set_id',
        'finished',
      ],
      project: summarise,
    },
    {
      name: 'full',
      description: 'The raw upstream directory entry under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: [],
  countFields: [
    'dosage_form',
    'route',
    'product_type',
    'marketing_category',
    'openfda.manufacturer_name.exact',
  ],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-ndc.json',
};
