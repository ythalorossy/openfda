/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Every path below was verified against the live API with an `_exists_`
 * probe (see scripts/probe-drugsfda-paths.mjs). Version 1.1.0 advertised six
 * paths that match nothing:
 *
 *   application.application_number        (application_number is TOP-LEVEL)
 *   application_docs.applications_doc_id      \
 *   application_docs.applications_doc_date     |  all five field names were
 *   application_docs.application_docs_title    |  fabricated; the real shape
 *   application_docs.applications_doc_type     |  is {id, url, date, type}
 *   application_docs.applications_doc_url     /
 *
 * `prefix` is what precedes the field in the query. An empty prefix means the
 * field is top-level and must be emitted bare.
 */
interface SectionDef {
  prefix: string;
  /** field name -> whether the search value must be upper-cased */
  fields: Record<string, { uppercase?: boolean }>;
}

export const SECTIONS: Record<string, SectionDef> = {
  application: {
    prefix: '',
    fields: {
      application_number: {},
      // Case-sensitive, stored uppercase: "UPJOHN" -> 13 results,
      // "Upjohn"/"upjohn" -> NOT_FOUND. Normalised so a caller typing
      // "Pfizer" does not get a silent miss that looks like absent data.
      sponsor_name: { uppercase: true },
    },
  },
  openfda: {
    prefix: 'openfda',
    fields: {
      application_number: {},
      brand_name: {},
      generic_name: {},
      manufacturer_name: {},
      route: {},
      substance_name: {},
      product_ndc: {},
    },
  },
  products: {
    prefix: 'products',
    fields: {
      dosage_form: {},
      marketing_status: {},
      product_number: {},
      reference_drug: {},
      route: {},
      te_code: {},
    },
  },
  submissions: {
    prefix: 'submissions',
    fields: {
      review_priority: {},
      submission_class_code: {},
      submission_number: {},
      submission_status: {},
      submission_status_date: {},
      submission_type: {},
    },
  },
  application_docs: {
    prefix: 'submissions.application_docs',
    fields: { id: {}, url: {}, date: {}, type: {} },
  },
};

export const SECTION_NAMES = Object.keys(SECTIONS) as readonly string[];

export type ResolveResult =
  | { ok: true; path: string; uppercase: boolean }
  | { ok: false; message: string };

/**
 * Resolve a (section, field) pair to a real query path, or explain why it is
 * not one. An invalid section or field must be distinguishable from a genuine
 * no-results — conflating the two is the defect this replaces.
 */
export function resolveField(section: string, field: string): ResolveResult {
  const def = SECTIONS[section];
  if (!def) {
    return {
      ok: false,
      message: `Unknown section "${section}". Valid sections: ${SECTION_NAMES.join(', ')}.`,
    };
  }

  const fieldDef = def.fields[field];
  if (!fieldDef) {
    return {
      ok: false,
      message: `Unknown field "${field}" for section "${section}". Valid fields: ${Object.keys(def.fields).join(', ')}.`,
    };
  }

  return {
    ok: true,
    path: def.prefix ? `${def.prefix}.${field}` : field,
    uppercase: fieldDef.uppercase === true,
  };
}
