/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

type RawLabel = Record<string, unknown>;

/** Coerce an openFDA label field to a string array; absent becomes []. */
const asArray = (value: unknown): string[] =>
  Array.isArray(value) ? (value as string[]) : [];

/**
 * Modern prescription labels follow the Physician Labeling Rule and store
 * this content in `warnings_and_cautions`; older OTC-style labels use
 * `warnings`. Consult both so PLR labels are not reported as empty.
 */
const resolveWarnings = (drug: RawLabel): string[] => {
  const legacy = asArray(drug.warnings);
  return legacy.length > 0 ? legacy : asArray(drug.warnings_and_cautions);
};

export interface SafetyFields {
  boxed_warning: string[];
  warnings: string[];
  warnings_and_cautions: string[];
  contraindications: string[];
  drug_interactions: string[];
  precautions: string[];
  adverse_reactions: string[];
  overdosage: string[];
  do_not_use: string[];
  ask_doctor: string[];
  ask_doctor_or_pharmacist: string[];
  stop_use: string[];
  pregnancy_or_breast_feeding: string[];
}

/**
 * Every key is always present. A consumer must be able to distinguish
 * "this drug has no boxed warning" (empty array) from "this server never
 * mapped the field" (missing key).
 */
export function mapSafetyFields(drug: RawLabel): SafetyFields {
  return {
    boxed_warning: asArray(drug.boxed_warning),
    warnings: resolveWarnings(drug),
    warnings_and_cautions: asArray(drug.warnings_and_cautions),
    contraindications: asArray(drug.contraindications),
    drug_interactions: asArray(drug.drug_interactions),
    precautions: asArray(drug.precautions),
    adverse_reactions: asArray(drug.adverse_reactions),
    overdosage: asArray(drug.overdosage),
    do_not_use: asArray(drug.do_not_use),
    ask_doctor: asArray(drug.ask_doctor),
    ask_doctor_or_pharmacist: asArray(drug.ask_doctor_or_pharmacist),
    stop_use: asArray(drug.stop_use),
    pregnancy_or_breast_feeding: asArray(drug.pregnancy_or_breast_feeding),
  };
}

export interface LabelFields {
  indications_and_usage: string[];
  boxed_warning: string[];
  warnings: string[];
  warnings_and_cautions: string[];
  do_not_use: string[];
  ask_doctor: string[];
  ask_doctor_or_pharmacist: string[];
  stop_use: string[];
  pregnancy_or_breast_feeding: string[];
}

/** The narrative fields `get-drug-by-name`'s description promises. */
export function mapLabelFields(drug: RawLabel): LabelFields {
  return {
    indications_and_usage: asArray(drug.indications_and_usage),
    boxed_warning: asArray(drug.boxed_warning),
    warnings: resolveWarnings(drug),
    warnings_and_cautions: asArray(drug.warnings_and_cautions),
    do_not_use: asArray(drug.do_not_use),
    ask_doctor: asArray(drug.ask_doctor),
    ask_doctor_or_pharmacist: asArray(drug.ask_doctor_or_pharmacist),
    stop_use: asArray(drug.stop_use),
    pregnancy_or_breast_feeding: asArray(drug.pregnancy_or_breast_feeding),
  };
}

/**
 * openfda.generic_name is absent on some labels — notably ones reached through
 * the spl_product_data_elements tier (Rayos, Cordarone), which have an empty
 * openfda object. "Unknown" reads like data and is indistinguishable from a
 * real value, so null is returned when neither structured field is present.
 *
 * Deliberately does NOT parse spl_product_data_elements: it is a free-text
 * blob of product elements, and extracting an ingredient from it would be
 * guesswork. (Tested and rejected — yields excipient text for Glucophage.)
 */
export function resolveGenericName(
  openfda: Record<string, unknown>
): string | null {
  const first = (value: unknown): string | undefined =>
    Array.isArray(value) && typeof value[0] === 'string' && value[0]
      ? value[0]
      : undefined;
  return first(openfda?.generic_name) ?? first(openfda?.substance_name) ?? null;
}
