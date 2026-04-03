import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolManager } from '../src/ToolManager';

// Mock McpServer before importing ToolManager
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: vi.fn().mockImplementation(function () {
      return {
        registerTool: vi.fn(),
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
      inputSchema: z.object({
        input: z.string().describe('An input'),
      }),
      handler: async ({ input }: { input: string }) => ({
        content: [{ type: 'text' as const, text: `Got: ${input}` }],
      }),
    };

    toolManager.registerTool(toolDef);

    expect(server.registerTool).toHaveBeenCalledTimes(1);
    expect(server.registerTool).toHaveBeenCalledWith(
      'test-tool',
      expect.objectContaining({
        title: 'test-tool',
        description: 'A test tool',
        inputSchema: expect.any(Object),
      }),
      expect.any(Function)
    );
  });

  it('should pass inputSchema to server.registerTool', () => {
    const toolDef = {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: z.object({
        name: z.string(),
      }),
      handler: async () => ({ content: [] }),
    };

    toolManager.registerTool(toolDef);

    const toolCall = (server.registerTool as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(toolCall[1].inputSchema).toBeDefined();
  });
});
