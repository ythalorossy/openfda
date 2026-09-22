/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * openFDA rejects a larger offset: "Skip value must 25000 or less."
 *
 * It lives here rather than in `executor.ts` because `shape/envelope.ts`
 * needs it to clamp `next_skip`, and `executor.ts` imports `envelope.ts` —
 * importing back the other way would cycle.
 */
export const SKIP_MAX = 25000;
