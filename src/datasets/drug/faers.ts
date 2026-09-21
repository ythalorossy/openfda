/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * FAERS `patient.reaction[].reactionoutcome` enumeration.
 *
 * The API returns bare numeric codes. Returning them unlabelled leaves the
 * consumer to guess, which is worse than useless for a safety dataset.
 */
export const REACTION_OUTCOMES: Record<string, string> = {
  '1': 'Recovered/resolved',
  '2': 'Recovering/resolving',
  '3': 'Not recovered/not resolved',
  '4': 'Recovered/resolved with sequelae',
  '5': 'Fatal',
  '6': 'Unknown',
};

export function describeOutcome(code: unknown): string {
  if (code === undefined || code === null || code === '') return 'Not reported';
  const key = String(code);
  return REACTION_OUTCOMES[key] ?? `Unrecognized outcome code "${key}"`;
}

/**
 * FAERS `serious` enumeration, from openFDA's published field reference
 * (https://open.fda.gov/fields/drugevent.yaml). The documented text is a full
 * sentence ("The adverse event resulted in death, a life threatening
 * condition, ..."); these are the short category labels for it, which is what
 * a ranked count needs.
 */
export const SERIOUSNESS: Record<string, string> = {
  '1': 'Serious',
  '2': 'Not serious',
};

/** FAERS `patient.patientsex` enumeration, from the same reference. */
export const PATIENT_SEX: Record<string, string> = {
  '0': 'Unknown',
  '1': 'Male',
  '2': 'Female',
};

/**
 * Which aggregatable fields carry coded integers rather than text. Anything
 * absent from this map is passed through unchanged — `reactionmeddrapt.exact`
 * and `occurcountry.exact` are already human-readable upstream.
 */
export const CODED_COUNT_FIELDS: Record<string, Record<string, string>> = {
  serious: SERIOUSNESS,
  'patient.patientsex': PATIENT_SEX,
  'patient.reaction.reactionoutcome': REACTION_OUTCOMES,
};

/**
 * Decode one aggregated term. openFDA sends coded terms as NUMBERS (measured),
 * so the code is stringified before lookup.
 */
export function describeCountTerm(field: string, term: unknown): string {
  if (term === undefined || term === null || term === '') return 'Not reported';
  const map = CODED_COUNT_FIELDS[field];
  if (!map) return String(term);
  const key = String(term);
  return map[key] ?? `Unrecognized ${field} code "${key}"`;
}
