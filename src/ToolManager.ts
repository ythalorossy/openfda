/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { checkApiKey } from './utils/env.js';

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  /**
   * Keys the tool's projections guarantee. Every real tool — the hand-written
   * ones and the ones `registerDataset` builds from a descriptor — carries
   * this, so it is part of the contract rather than an untyped passenger
   * property. `registerTool` itself never reads it; the drift guard does.
   */
  returnsFields?: readonly string[];
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
      (async (input: z.infer<any>) => {
        // Single chokepoint: every tool inherits the key check, so a missing
        // key can never reach the network or produce a misleading 403.
        const status = checkApiKey();
        if (!status.ok) {
          return {
            content: [{ type: 'text' as const, text: status.message }],
            isError: true,
          };
        }
        return definition.handler(input);
      }) as any
    );
}

export { ToolManager };
