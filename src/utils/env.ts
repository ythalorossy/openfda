/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export type ApiKeyStatus =
  | { ok: true; apiKey: string | null }
  | { ok: false; message: string };

export const MISSING_KEY_MESSAGE =
  'OPENFDA_API_KEY is not set. This server reads the key from its process ' +
  'environment; a .env file is not loaded. Add it to the "env" block of your ' +
  'MCP client configuration. Get a free key at ' +
  'https://open.fda.gov/apis/authentication/\n\n' +
  'To run without a key on the unauthenticated tier (40 requests/minute, ' +
  '1,000/day per IP, and no rate-limit headers), set OPENFDA_ALLOW_KEYLESS=1.';

export const KEYLESS_WARNING =
  'openfda: OPENFDA_ALLOW_KEYLESS=1 — using the unauthenticated tier ' +
  '(40 requests/minute, no rate-limit visibility). Set OPENFDA_API_KEY for ' +
  '240 requests/minute.';

export const MISSING_KEY_WARNING =
  'openfda: OPENFDA_API_KEY is not set; every tool call will return a ' +
  'configuration error. See https://open.fda.gov/apis/authentication/';

/**
 * Decide whether a request may be made, and with which key.
 *
 * A missing key fails fast rather than silently falling back to the keyless
 * tier: keyless returns no rate-limit headers, so exhausting it surfaces as
 * slow, intermittent 429 retries rather than a clear error.
 */
export function checkApiKey(
  env: NodeJS.ProcessEnv = process.env
): ApiKeyStatus {
  const apiKey = env.OPENFDA_API_KEY?.trim();
  if (apiKey) return { ok: true, apiKey };
  if (env.OPENFDA_ALLOW_KEYLESS === '1') return { ok: true, apiKey: null };
  return { ok: false, message: MISSING_KEY_MESSAGE };
}

/** Emit a one-time startup notice to stderr. Never logs the key itself. */
export function warnIfKeyless(env: NodeJS.ProcessEnv = process.env): void {
  const status = checkApiKey(env);
  if (!status.ok) console.error(MISSING_KEY_WARNING);
  else if (status.apiKey === null) console.error(KEYLESS_WARNING);
}
