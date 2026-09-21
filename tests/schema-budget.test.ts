import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { toToolDefinition } from '../src/core/registry';

/**
 * Every tool description and parameter description is loaded into an agent's
 * context on connect, whether or not the tool is ever called. This ceiling is
 * the budget: ~20k characters is roughly 5k tokens, against ~1.6k for the nine
 * 1.x tools and ~20k+ if a field enum were ever allowed to list a whole
 * endpoint's reference (druglabel alone publishes hundreds of fields).
 *
 * If this fails, trim prose — do NOT drop the field names a projection
 * guarantees, because the drift guard depends on them.
 */
const MAX_TOTAL_SCHEMA_CHARS = 20000;

/** Approximate, and deliberately so: an order-of-magnitude guard, not a meter. */
function approximateSchemaCost(shape: z.ZodRawShape): number {
  let cost = 0;
  for (const [key, schema] of Object.entries(shape)) {
    cost += key.length;
    cost += (schema.description ?? '').length;
    let inner: any = schema;
    while (inner?._def?.innerType) inner = inner._def.innerType;
    if (inner !== schema) cost += (inner?.description ?? '').length;
    if (Array.isArray(inner?._def?.values)) cost += inner._def.values.join(',').length;
  }
  return cost;
}

describe('tool schema context budget', () => {
  it(`stays under ${MAX_TOTAL_SCHEMA_CHARS} characters in total`, () => {
    let total = 0;
    const perTool: string[] = [];
    for (const descriptor of DRUG_ENDPOINTS) {
      const tool = toToolDefinition(descriptor);
      const cost = tool.description.length + approximateSchemaCost(tool.inputSchema.shape);
      perTool.push(`${tool.name}: ${cost}`);
      total += cost;
    }
    expect(total, `per-tool cost — ${perTool.join(', ')}`).toBeLessThanOrEqual(
      MAX_TOTAL_SCHEMA_CHARS
    );
  });
});
