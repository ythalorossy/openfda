import { describe, it, expect, vi } from 'vitest';
import { registerDataset } from '../src/core/registry';
import { ToolManager } from '../src/ToolManager';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';

describe('drug group registration', () => {
  it('registers one tool per endpoint, named drug-<endpoint>', () => {
    const registerTool = vi.fn();
    const manager = new ToolManager({ registerTool } as never);

    registerDataset(manager, DRUG_ENDPOINTS);

    const names = registerTool.mock.calls.map((call) => call[0]);
    for (const descriptor of DRUG_ENDPOINTS) {
      expect(names).toContain(descriptor.toolName);
      expect(descriptor.toolName).toBe(`${descriptor.dataset}-${descriptor.endpoint}`);
    }
    expect(names).toHaveLength(DRUG_ENDPOINTS.length);
  });

  it('every registered tool still passes through the API-key chokepoint', async () => {
    const registerTool = vi.fn();
    const manager = new ToolManager({ registerTool } as never);
    registerDataset(manager, DRUG_ENDPOINTS);

    const previousKey = process.env.OPENFDA_API_KEY;
    const previousKeyless = process.env.OPENFDA_ALLOW_KEYLESS;
    delete process.env.OPENFDA_API_KEY;
    delete process.env.OPENFDA_ALLOW_KEYLESS;
    try {
      for (const call of registerTool.mock.calls) {
        const handler = call[2] as (input: unknown) => Promise<{ isError?: boolean; content: { text: string }[] }>;
        const result = await handler({ value: 'Advil' });
        expect(result.isError).toBe(true);
        expect(result.content[0]!.text).toContain('OPENFDA_API_KEY');
      }
    } finally {
      if (previousKey !== undefined) process.env.OPENFDA_API_KEY = previousKey;
      if (previousKeyless !== undefined) process.env.OPENFDA_ALLOW_KEYLESS = previousKeyless;
    }
  });
});
