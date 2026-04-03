/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: (input: z.infer<any>) => Promise<{
    content: {
      type: string;
      text: string;
    }[];
    isError?: boolean;
  }>;
};

class ToolManager {
  constructor(private readonly server: McpServer) {}

  registerTool = (definition: ToolDefinition) =>
    this.server.registerTool(
      definition.name,
      {
        title: definition.name,
        description: definition.description,
        inputSchema: definition.inputSchema,
      },
      definition.handler as any
    );
}

export { ToolManager };
