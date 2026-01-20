/*
 * Copyright (c) 2024 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { OpenFDABuilder } from './OpenFDABuilder.js';
import { makeOpenFDARequest } from './ApiHandler.js';
import { OpenFDAResponse } from './types.js';

type ToolDefinition<T extends z.ZodObject<any>> = {
  name: string;
  description: string;
  schema: T;
  handler: (
    input: z.infer<T>
  ) => Promise<{ content: { type: 'text'; text: string }[] }>;
};

class ToolManager {
  constructor(private server: McpServer) {}

  registerTool<T extends z.ZodObject<any>>(definition: ToolDefinition<T>) {
    this.server.tool(
      definition.name,
      definition.description,
      definition.schema.shape,
      definition.handler
    );
  }
}

export { ToolManager };
