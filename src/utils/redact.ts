/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Replace the value of any `api_key` query parameter with `<REDACTED>`.
 *
 * Use this anywhere a string that might contain a built openFDA URL could
 * reach a log, an error message, or tool output. Tool output flows into LLM
 * context and transcripts, so a leaked key there is a leaked key on disk.
 */
export const redactApiKey = (input: string): string =>
  input.replace(/([?&]api_key=)[^&\s]*/gi, '$1<REDACTED>');
