/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { EndpointDescriptor, FieldSpec } from '../../core/descriptor.js';
import { capArray } from '../../core/shape/project.js';

/**
 * The 20 paths selected in docs/superpowers/notes/2026-09-20-field-selection.md
 * (`## drugsfda`), not the full 25-path 1.x table that used to live in
 * `src/drug/drugsfda-sections.ts` (removed once the 1.x tools were cut over).
 * That table seeded this selection — every path here was live-probed with an
 * `_exists_` check in 1.2.0 — but seven of the 25 were deliberately dropped
 * (duplicates, per-application ordinals, or opaque per-document values), and
 * two better-populated `products.*` paths were added in their place.
 * `tests/parity/drugsfda-parity.test.ts` checked every 1.x path was either
 * exposed here or named as deliberately dropped in that note before the 1.x
 * tools and the parity suite were both removed; the note remains the record
 * of that decision.
 */
const PATHS: Array<[name: string, description: string, uppercase?: boolean]> = [
  ['application_number', 'FDA application number, e.g. NDA020235'],
  // Case-sensitive, stored uppercase: "UPJOHN" -> 13 results, "Upjohn" ->
  // NOT_FOUND. Normalised so a caller typing "Pfizer" does not get a silent
  // miss that looks like absent data — a defect fixed in 1.2.0.
  ['sponsor_name', 'application sponsor; stored uppercase', true],
  ['products.brand_name', 'proprietary brand name (default); 98.79% populated'],
  ['products.active_ingredients.name', 'active ingredient name'],
  ['products.dosage_form', 'dosage form, e.g. TABLET'],
  ['products.route', 'Drugs@FDA product route'],
  ['products.marketing_status', 'e.g. Prescription, Discontinued'],
  ['products.reference_drug', 'whether product is a reference drug'],
  ['products.te_code', 'therapeutic equivalence code'],
  [
    'openfda.brand_name',
    'openFDA-harmonised brand name; sparse, only 42.31% populated',
  ],
  ['openfda.generic_name', 'normalised generic name'],
  ['openfda.substance_name', 'normalised substance name'],
  ['openfda.manufacturer_name', 'marketed-product manufacturer'],
  ['openfda.route', 'SPL route of administration'],
  ['openfda.product_ndc', 'product NDC'],
  ['submissions.submission_type', 'e.g. ORIG, SUPPL'],
  ['submissions.submission_status', 'e.g. AP (approved)'],
  ['submissions.submission_status_date', 'date submission reached its status'],
  ['submissions.submission_class_code', 'kind of change a supplement made'],
  ['submissions.review_priority', 'e.g. PRIORITY, STANDARD'],
];

/**
 * A single Neurontin application with 38 submissions measures 21,042
 * characters — roughly 550 per submission. Ten keeps a record near 5.5k.
 */
export const MAX_SUBMISSIONS_PER_RECORD = 10;

/** openFDA omits te_code on some products; emit it either way. */
function normaliseProduct(
  product: Record<string, unknown>
): Record<string, unknown> {
  return { ...product, te_code: product.te_code ?? null };
}

// Upstream Drugs@FDA records are genuinely untyped and vary per record.
function base(record: any): Record<string, unknown> {
  return {
    application_number: record?.application_number ?? null,
    sponsor_name: record?.sponsor_name ?? null,
    // openFDA omits `openfda` entirely on most records (43/50 for a LILLY
    // sponsor search); emit it either way, matching te_code above.
    openfda: record?.openfda ?? {},
    products: (Array.isArray(record?.products) ? record.products : []).map(
      normaliseProduct
    ),
    submission_count: Array.isArray(record?.submissions)
      ? record.submissions.length
      : 0,
  };
}

const fields: FieldSpec[] = PATHS.map(([name, description, uppercase]) => ({
  name,
  description,
  ...(uppercase ? { uppercase: true } : {}),
  strategy: { kind: 'exact' as const, path: name },
}));

export const drugDrugsfda: EndpointDescriptor = {
  dataset: 'drug',
  endpoint: 'drugsfda',
  toolName: 'drug-drugsfda',
  summary:
    'Search Drugs@FDA application data — approvals, sponsors, products and submissions. ' +
    'products[].route is the Drugs@FDA product route and uses a different controlled vocabulary ' +
    'from drug-label openfda.route, so joining on route across tools will silently miss.',
  fields,
  // NOT openfda.brand_name: that block is present on only 42.31% of
  // applications (measured in the field-selection note), so defaulting to
  // it would make most genuine brand-name searches come back empty, which
  // looks indistinguishable from "this drug does not exist" — exactly the
  // failure mode this release exists to close. products.brand_name is the
  // best-covered name-like field on this descriptor (98.79%), matching the
  // convention every other endpoint follows: default to the most name-like
  // field with (near-)full coverage.
  defaultField: 'products.brand_name',
  projections: [
    {
      name: 'summary',
      description:
        'Application, sponsor, openfda block and products, with a submission count only.',
      returnsFields: [
        'application_number',
        'sponsor_name',
        'openfda',
        'products',
        'submission_count',
      ],
      project: base,
    },
    {
      name: 'full',
      description: `Adds submissions, capped at ${MAX_SUBMISSIONS_PER_RECORD} per record.`,
      returnsFields: [
        'application_number',
        'sponsor_name',
        'openfda',
        'products',
        'submission_count',
        'submissions',
        'submissions_truncated',
      ],
      project: (record: any) => {
        const capped = capArray(
          record?.submissions,
          MAX_SUBMISSIONS_PER_RECORD
        );
        return {
          ...base(record),
          submissions: capped.rows,
          submissions_truncated: capped.truncated,
        };
      },
    },
  ],
  sortFields: [],
  countFields: [
    'sponsor_name',
    'products.marketing_status',
    'products.dosage_form.exact',
  ],
  codeMaps: {},
  limits: { default: 5, max: 100 },
  catalog: 'src/catalog/drug-drugsfda.json',
};
