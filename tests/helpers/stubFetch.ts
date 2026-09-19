import { vi } from 'vitest';

/**
 * Replace global fetch with a stub that returns the given JSON payloads in
 * order. Returns the list of requested URLs so a test can assert both what
 * was requested and that nothing was requested at all.
 */
export function stubFetch(responses: unknown[]): {
  calls: string[];
  restore: () => void;
} {
  const calls: string[] = [];
  let index = 0;
  const original = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: any) => {
    calls.push(String(input));
    const body = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => body,
    } as any;
  }) as any;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
