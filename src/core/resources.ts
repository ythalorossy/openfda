/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { EndpointDescriptor } from './descriptor.js';

/**
 * Publish each endpoint's full FDA field list as a resource.
 *
 * A tool's schema is loaded into an agent's context on connect; a resource is
 * read only on demand. That split is what lets the `field` enum stay curated
 * (10–20 entries) while the several-hundred-field long tail stays reachable.
 */
export function registerCatalogResources(
  server: McpServer,
  descriptors: readonly EndpointDescriptor[],
  load: (descriptor: EndpointDescriptor) => unknown
): void {
  for (const descriptor of descriptors) {
    const uri = `openfda://${descriptor.dataset}/${descriptor.endpoint}/fields`;
    server.registerResource(
      `${descriptor.toolName}-fields`,
      uri,
      {
        title: `${descriptor.toolName} field catalog`,
        description:
          `Every field openFDA publishes for /${descriptor.dataset}/${descriptor.endpoint}.json, ` +
          `with its description and the share of records that populate it. The tool's own field ` +
          `parameter exposes only the curated subset; read this to find anything else.`,
        mimeType: 'application/json',
      },
      async (resourceUri: URL) => ({
        contents: [
          {
            uri: resourceUri.href,
            mimeType: 'application/json',
            text: JSON.stringify(load(descriptor), null, 2),
          },
        ],
      })
    );
  }
}
