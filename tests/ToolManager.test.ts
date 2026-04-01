import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolManager } from '../src/ToolManager';

// Mock McpServer before importing ToolManager
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(function() {
      return {
        tool: vi.fn(),
        connect: vi.fn(),
      };
    }),
  };
});

describe('ToolManager', () => {
  let server: McpServer;
  let toolManager: ToolManager;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    toolManager = new ToolManager(server);
  });

  it('should register a tool with the server', () => {
    const toolDef = {
      name: 'test-tool',
      description: 'A test tool',
      schema: z.object({
        input: z.string().describe('An input'),
      }),
      handler: async ({ input }: { input: string }) => ({
        content: [{ type: 'text' as const, text: `Got: ${input}` }],
      }),
    };

    toolManager.registerTool(toolDef);

    expect(server.tool).toHaveBeenCalledTimes(1);
    expect(server.tool).toHaveBeenCalledWith(
      'test-tool',
      'A test tool',
      expect.objectContaining({
        input: expect.any(Object),
      }),
      expect.any(Function)
    );
  });

  it('should pass schema.shape to server.tool (SDK workaround)', () => {
    const toolDef = {
      name: 'test-tool',
      description: 'A test tool',
      schema: z.object({
        name: z.string(),
      }),
      handler: async () => ({ content: [] }),
    };

    toolManager.registerTool(toolDef);

    const toolCall = (server.tool as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(toolCall[2]).toBeDefined();
  });
});