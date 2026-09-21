/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

/**
 * The 12 paths selected in docs/superpowers/notes/2026-09-20-field-selection.md
 * (`## orangebook`). `products.marketing_status` was seeded by the plan but
 * is absent from FDA's own published field reference (drugorangebook.yaml)
 * and so fails the catalog-conformance guard; `products.application_type`
 * and `products.reference_listed_drug` already cover the innovator-vs-generic
 * question it would have answered. `products.therapeutic_equivalence_codes`,
 * `products.reference_listed_drug`, `products.reference_standard` and
 * `products.application_name` were added — the first three are the substance
 * of the Orange Book and their absence would leave the dataset's purpose
 * unsearchable.
 */
const PATHS: Array<[name: string, description: string]> = [
  ['products.brand_name', 'proprietary (brand) name'],
  ['products.active_ingredients.name', 'active ingredient name'],
  ['products.application_number', 'ANDA/NDA number; joins drugsfda, ndc'],
  ['products.application_type', 'A = ANDA (generic), N = NDA (brand)'],
  ['products.application_full_name', "applicant's full legal name"],
  ['products.application_name', "applicant's short name"],
  [
    'products.therapeutic_equivalence_codes',
    'TE code (AB, BX, ...); sparse ~45%',
  ],
  ['products.reference_listed_drug', 'whether product is the RLD'],
  ['products.reference_standard', 'whether product is the BE reference'],
  ['products.dosage_form', 'dosage form, e.g. TABLET'],
  ['products.route', 'route of administration'],
  ['approval_date', 'date FDA approved the product'],
];

const fields: FieldSpec[] = PATHS.map(([name, description]) => ({
  name,
  description,
  strategy: { kind: 'exact' as const, path: name },
}));

// Upstream Orange Book product entries are genuinely untyped.
function flattenProduct(product: any): Record<string, unknown> {
  return {
    brand_name: product?.brand_name ?? null,
    application_number: product?.application_number ?? null,
    application_type: product?.application_type ?? null,
    application_full_name: product?.application_full_name ?? null,
    application_name: product?.application_name ?? null,
    active_ingredients: asArray(product?.active_ingredients),
    therapeutic_equivalence_codes:
      product?.therapeutic_equivalence_codes ?? null,
    dosage_form: product?.dosage_form ?? null,
    route: product?.route ?? null,
    // Emitted either way: false is a fact ("not the reference product"),
    // not a missing value, so `?? null` (not `||`) only substitutes on
    // genuine absence.
    reference_listed_drug: product?.reference_listed_drug ?? null,
    reference_standard: product?.reference_standard ?? null,
  };
}

function summarise(record: any): Record<string, unknown> {
  return {
    approval_date: record?.approval_date ?? null,
    product_number: record?.product_number ?? null,
    products: asArray(record?.products).map(flattenProduct),
  };
}

export const drugOrangebook: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'orangebook',
  toolName: 'drug-orangebook',
  summary:
    'Search the Orange Book — FDA-approved drug products with their therapeutic-equivalence ' +
    'ratings. Almost all data lives in the nested products array; this tool flattens it into ' +
    'one entry per product. reference_listed_drug and reference_standard are booleans always ' +
    'returned, where false is a fact (not the reference product), never a missing value. ' +
    'application_type A is a generic (ANDA), N is the brand (NDA).',
  fields,
  defaultField: 'products.brand_name',
  projections: [
    {
      name: 'summary',
      description:
        'Approval date and every approved product, flattened, with its equivalence flags.',
      returnsFields: ['approval_date', 'product_number', 'products'],
      project: summarise,
    },
    {
      name: 'full',
      description: 'The raw upstream Orange Book entry under `record`.',
      returnsFields: ['record'],
      project: (record: any) => ({ record }),
    },
  ],
  sortFields: ['approval_date:desc', 'approval_date:asc'],
  countFields: [
    'products.application_type',
    'products.dosage_form',
    'products.route',
    'products.therapeutic_equivalence_codes',
  ],
  codeMaps: {},
  limits: { default: 5, max: 50 },
  catalog: 'src/catalog/drug-orangebook.json',
};
