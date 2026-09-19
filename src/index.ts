/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolManager } from './ToolManager.js';
import { warnIfKeyless } from './utils/env.js';
import {
  getDrugByName,
  getDrugByGenericName,
  getDrugAdverseEvents,
  getDrugsByManufacturer,
  getDrugSafetyInfo,
  getDrugByNdc,
  getDrugByProductNdc,
  getDrugsfda,
} from './drug/index.js';

// Replaced at build time by vite (see vite.config.ts) with the version from
// package.json. The fallback only applies when running unbundled, e.g. vitest.
declare const __APP_VERSION__: string;
const VERSION =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';

const server = new McpServer(
  {
    name: 'openfda',
    version: VERSION,
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
toolManager.registerTool(getDrugsfda);

async function main() {
  warnIfKeyless();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenFDA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
