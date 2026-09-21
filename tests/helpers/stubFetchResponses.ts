import { vi } from 'vitest';

/**
 * Like stubFetch, but each response carries its own HTTP status, so a test can
 * exercise the 404-means-no-matches path that the live API actually produces.
 *
 * `text`, when given, is served verbatim from `response.text()` instead of
 * `JSON.stringify(body)` — openFDA answers a bogus dataset or endpoint path
 * with a bare, non-JSON 404 body, and a test needs to be able to stub that
 * shape too, distinct from its JSON `NOT_FOUND` envelope.
 *
 * `json()` and `text()` are not two independent fields to keep in sync: the
 * raw text is the single source of truth, and `json()` is derived from it by
 * `JSON.parse`, exactly as a real `Response.json()` is (`JSON.parse(await
 * text())`). A stub given non-JSON `text` therefore has its `json()` reject
 * with the same `SyntaxError` a real fetch would throw, instead of silently
 * resolving `undefined` — a stub that cannot model a Response `fetch` would
 * never actually produce.
 */
export function stubFetchResponses(
  responses: Array<{ status?: number; body?: unknown; text?: string }>
): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  let index = 0;
  const original = globalThis.fetch;

  globalThis.fetch = vi.fn(async (input: any) => {
    calls.push(String(input));
    const response = responses[Math.min(index, responses.length - 1)]!;
    index += 1;
    const status = response.status ?? 200;
    const rawText = response.text ?? JSON.stringify(response.body);
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      json: async () => JSON.parse(rawText),
      text: async () => rawText,
    } as any;
  }) as any;

  return { calls, restore: () => { globalThis.fetch = original; } };
}
