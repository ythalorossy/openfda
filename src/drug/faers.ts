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
