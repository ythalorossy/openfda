/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { Projection } from '../descriptor.js';

/** Cap a nested array, reporting whether anything was actually dropped. */
export function capArray<T>(
  rows: T[] | undefined,
  max: number
): { rows: T[]; truncated: boolean } {
  const all = Array.isArray(rows) ? rows : [];
  return { rows: all.slice(0, max), truncated: all.length > max };
}

export function applyProjection(
  projection: Projection,
  records: readonly unknown[]
): Record<string, unknown>[] {
  return records.map((record) => projection.project(record));
}
