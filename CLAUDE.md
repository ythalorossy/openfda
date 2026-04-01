# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides tools for querying drug information from the OpenFDA API. The server communicates over stdio and requires an `OPENFDA_API_KEY` environment variable.

## Commands

```bash
npm run build      # Compile TypeScript to dist/ and bin/
npm run dev        # Start development server
npm run test       # Run Vitest tests
npm run test:ci    # Run tests in CI mode (no watch)
npm run typecheck  # TypeScript type checking
npm run lint       # Run ESLint
```

For single test file: `npx vitest run tests/ApiHandler.test.ts`

## Key Files

- **`vite.config.ts`**: Vite build configuration; externalizes SDK for StdioServerTransport compatibility
- **`tests/`**: Vitest test suite (13 tests across ApiHandler, OpenFDABuilder, ToolManager)

## Architecture

### Entry Point: `src/index.ts`
The MCP server is initialized with `McpServer` from `@modelcontextprotocol/sdk`. All tool handlers are defined here and registered via `ToolManager`.

### Tool Registration Pattern
Tools are registered in `src/index.ts` using `ToolManager.registerTool()` with:
- `name`: MCP tool identifier
- `description`: Human-readable description for AI consumers
- `schema`: Zod schema for input validation
- `handler`: Async function receiving parsed input, returns `{ content: [{ type: 'text', text: string }] }`

### Tool Registration Gotcha
The MCP SDK has a bug with Zod schema validation. Always use `schema.shape` instead of passing `schema` directly to `server.tool()`.

### Key Modules
- **`OpenFDABuilder`** (`src/OpenFDABuilder.ts`): Constructs OpenFDA API URLs using fluent builder pattern. Accepts context (`label`, `event`, `ndc`), search query, and limit.
- **`ApiHandler`** (`src/ApiHandler.ts`): HTTP client with retry logic (exponential backoff), timeout handling, and OpenFDA-specific error categorization.
- **`ToolManager`** (`src/ToolManager.ts`): Thin wrapper around `McpServer.tool()` registration.
- **`types.ts`**: TypeScript interfaces for OpenFDA API responses and error types.

### API Request Flow
1. Tool handler receives input → `OpenFDABuilder` constructs URL
2. `makeOpenFDARequest()` fetches with retry/exponential backoff
3. Handler formats response as MCP-compatible JSON text

### Available Tools
- `get-drug-by-name` - Search by brand name
- `get-drug-by-generic-name` - Search by active ingredient
- `get-drug-adverse-events` - Adverse event reports
- `get-drugs-by-manufacturer` - Drugs by company
- `get-drug-safety-info` - Warnings, contraindications, interactions
- `get-drug-by-ndc` - Search by National Drug Code
- `get-drug-by-product-ndc` - Search by product NDC only

## Environment

Requires `OPENFDA_API_KEY` environment variable (from OpenFDA API authentication). Create a `.env` file locally; the server reads it at runtime.
