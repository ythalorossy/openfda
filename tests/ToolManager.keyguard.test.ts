import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToolManager } from '../src/ToolManager';
import { MISSING_KEY_MESSAGE } from '../src/utils/env';
import { stubFetch } from './helpers/stubFetch';
import z from 'zod';

function fakeServer() {
  const registered: Record<string, (input: unknown) => Promise<any>> = {};
  return {
    registered,
    registerTool: (name: string, _config: unknown, handler: any) => {
      registered[name] = handler;
    },
  };
}

describe('ToolManager API key guard', () => {
  const originalEnv = process.env;
  let fetchStub: ReturnType<typeof stubFetch>;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENFDA_API_KEY;
    delete process.env.OPENFDA_ALLOW_KEYLESS;
    fetchStub = stubFetch([{ meta: { results: { total: 0 } }, results: [] }]);
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchStub.restore();
  });

  const tool = (calls: string[]) => ({
    name: 'demo-tool',
    description: 'demo',
    inputSchema: z.object({}),
    handler: async () => {
      calls.push('handler ran');
      return { content: [{ type: 'text', text: 'ok' }] };
    },
  });

  it('returns an actionable error and never calls the handler when the key is missing', async () => {
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    const result = await server.registered['demo-tool']({});

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(MISSING_KEY_MESSAGE);
    expect(handlerCalls).toEqual([]);
  });

  it('makes zero network requests when the key is missing', async () => {
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool([]));

    await server.registered['demo-tool']({});

    expect(fetchStub.calls).toEqual([]);
  });

  it('never echoes the key in the guard message', async () => {
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool([]));

    const result = await server.registered['demo-tool']({});

    // Guards against a leaked `api_key=<value>` query fragment (the actual
    // secret). This message is required to name the OPENFDA_API_KEY env var,
    // so a bare /api_key/i would false-positive on that variable name.
    expect(result.content[0].text).not.toMatch(/api_key=/i);
  });

  it('runs the handler when a key is present', async () => {
    process.env.OPENFDA_API_KEY = 'TEST_API_KEY';
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    const result = await server.registered['demo-tool']({});

    expect(handlerCalls).toEqual(['handler ran']);
    expect(result.isError).toBeUndefined();
  });

  it('runs the handler when keyless is explicitly opted into', async () => {
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const handlerCalls: string[] = [];
    const server = fakeServer();
    new ToolManager(server as any).registerTool(tool(handlerCalls));

    await server.registered['demo-tool']({});

    expect(handlerCalls).toEqual(['handler ran']);
  });
});
