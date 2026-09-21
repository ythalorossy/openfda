import { vi } from 'vitest';

/**
 * Like stubFetch, but each response carries its own HTTP status, so a test can
 * exercise the 404-means-no-matches path that the live API actually produces.
 */
export function stubFetchResponses(
  responses: Array<{ status?: number; body: unknown }>
): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  let index = 0;
  const original = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: any) => {
    calls.push(String(input));
    const response = responses[Math.min(index, responses.length - 1)]!;
    index += 1;
    const status = response.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    } as any;
  }) as any;

  return { calls, restore: () => { globalThis.fetch = original; } };
}
