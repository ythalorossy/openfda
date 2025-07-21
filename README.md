# OpenFDA MCP Server

A Model Context Protocol (MCP) server for querying drug information from the OpenFDA API.

## Features

- Retrieve drug label information by brand name
- Returns key drug information fields (brand name, generic name, manufacturer, NDC, etc.)

1. **Set up your OpenFDA API Key**

   The MCP server requires an OpenFDA API key to access the OpenFDA API.  
   Create a `.env` file in the root of your project and add the following line:

   ```env
   OPENFDA_API_KEY=your_openfda_api_key_here
   ```

   > **Note:** Never commit your real API key to version control.  
   > You can obtain an API key from [OpenFDA API Key Registration](https://open.fda.gov/apis/authentication/).

2. **Example MCP Server Configuration**

   If you are integrating this server with a larger MCP system, your configuration might look like:

   ```json
   {
     "mcpServers": {
       "openfda": {
         "command": "npx",
         "args": ["@ythalorossy/openfda"],
         "env": {
           "OPENFDA_API_KEY": "************"
         },
         "timeout": 60000
       }
     }
   }
   ```

   Replace the asterisks with your actual API key, or ensure it is loaded from your `.env` file.

## Want to run it local?

```bash
git clone https://github.com/ythalorossy/openfda.git
cd openfda
npm install
```

## Usage

First, build the project:

```bash
npm run build
```

Then, start the server from the build folder:

```bash
node build/index.js
```

**Key Points:**
- The build step (`npm run build`) compiles your source files into the build/ directory.
- You should run the compiled output (e.g., `build/bin/index.js`), not the source file (`bin/index.js`), unless your project is set up to run directly from source.


## Configuration

Create a `.env` file for any required environment variables.

## License

MIT 