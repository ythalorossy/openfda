/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolManager } from './ToolManager.js';
import {
  getDrugByName,
  getDrugByGenericName,
  getDrugAdverseEvents,
  getDrugsByManufacturer,
  getDrugSafetyInfo,
  getDrugByNdc,
  getDrugByProductNdc,
} from './drug/index.js';

const server = new McpServer(
  {
    name: 'openfda',
    version: '1.0.0',
    description: 'OpenFDA Model Context Protocol',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const toolManager = new ToolManager(server);

toolManager.registerTool(getDrugByName);
toolManager.registerTool(getDrugByGenericName);
toolManager.registerTool(getDrugAdverseEvents);
toolManager.registerTool(getDrugsByManufacturer);
toolManager.registerTool(getDrugSafetyInfo);
toolManager.registerTool(getDrugByNdc);
toolManager.registerTool(getDrugByProductNdc);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenFDA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
