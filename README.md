# OpenFDA MCP

A Model Context Protocol (MCP) server for querying drug information from the OpenFDA API.

## Features

- Retrieve drug label information by brand name
- Returns key drug information fields (brand name, generic name, manufacturer, NDC, etc.)

## Installation

```bash
git clone https://github.com/yourusername/openfda-mcp.git
cd openfda-mcp
npm install
```

## Usage

First, build the project:

```bash
npm run build
```

Then, start the server from the build folder:

```bash
node build/bin/index.js
```
```

**Key Points:**
- The build step (`npm run build`) compiles your source files into the build/ directory.
- You should run the compiled output (e.g., `build/bin/index.js`), not the source file (`bin/index.js`), unless your project is set up to run directly from source.


## Configuration

Create a `.env` file for any required environment variables.

## License

MIT 