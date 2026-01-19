/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { OpenFDABuilder } from './OpenFDABuilder';
import { makeOpenFDARequest } from './ApiHandler';
import { OpenFDAResponse } from './types';

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
      definition.schema,
      definition.handler
    );
  }
}

export { ToolManager };
