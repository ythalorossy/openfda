# OpenFDA MCP Server

A Model Context Protocol (MCP) server for querying drug information from the OpenFDA API.

<a href="https://glama.ai/mcp/servers/@ythalorossy/openfda">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ythalorossy/openfda/badge" alt="OpenFDA MCP server" />
</a>

## Features

- Retrieve drug label information by brand name
- Retrieve drug information by generic (active ingredient) name
- Get all brand versions of a generic drug
- Get adverse event (side effect) reports for a drug (by brand or generic name), with paging via `skip` (maximum 25000) and ordering via `sort` (`receivedate:desc` / `receivedate:asc`) — without `sort`, results are a deterministic earliest-`report_id` slice, so a small sample is not representative
- Rank adverse-event values for a drug by frequency (e.g. the most commonly reported reactions) via `get-drug-adverse-event-counts`; note that openFDA omits a result total on aggregated responses, so this tool reports no total
- Retrieve all drugs manufactured by a specific company
- Get comprehensive drug safety information (warnings, contraindications, interactions, precautions, etc.)
- Retrieve full Drugs@FDA application data for a given section and field, with a `limit` parameter and a real `Showing N of M` total; can also search by `sponsor_name`, which is stored uppercase and normalised automatically
- Normalize and validate NDC (National Drug Code) formats
- Helpful error messages and suggestions for failed queries

1. **Set up your OpenFDA API Key**

   The server reads `OPENFDA_API_KEY` from its process environment. It is
   launched by your MCP client, so the key belongs in the `env` block of your
   client configuration (shown below) — **a `.env` file is not read.**

   Get a key from [OpenFDA API Key Registration](https://open.fda.gov/apis/authentication/).
   A key raises your limit from 40 to 240 requests per minute.

   Without a key, every tool call returns a configuration error rather than
   failing confusingly upstream. To run on the unauthenticated tier anyway,
   set `OPENFDA_ALLOW_KEYLESS=1` — note that tier reports no rate-limit
   headers, so exhausting it surfaces as slow, intermittent failures.

   > **Note:** Never commit your real API key to version control.

2. **Example MCP Server Configuration**

   If you are integrating this server with a larger MCP system, your configuration might look like:

   ```json
    {
      "mcpServers": {
          "openfda": {
              "command": "npx",
              "args": [
                  "-y",
                  "@ythalorossy/openfda"
              ],
              "env": {
                  "OPENFDA_API_KEY": "*****************************************"
              },
              "timeout": 60000,
              "autoApprove": [
                  "get-drug-by-name",
                  "get-drug-by-generic-name",
                  "get-drug-adverse-events",
                  "get-drugs-by-manufacturer",
                  "get-drug-safety-info",
                  "get-drug-by-ndc",
                  "get-drug-by-product-ndc",
                  "get-drugsfda",
                  "get-drug-adverse-event-counts"
              ]
          }
      }
    }
   ```

   Replace the asterisks with your actual API key.

## Want to run it locally?

```bash
git clone https://github.com/ythalorossy/openfda.git
cd openfda
npm install
npm run build
```

Then start the server:

```bash
node dist/index.js
```

Or use it directly with npx:

```bash
npx @ythalorossy/openfda
```

## Configuration

Export `OPENFDA_API_KEY` in your shell before running locally: `export OPENFDA_API_KEY=your_key`.

## License

MIT 

[Buy me a Coffee](https://buymeacoffee.com/ythalorossy)

![coff.ee/ythalorossy](https://raw.githubusercontent.com/ythalorossy/openfda/refs/heads/main/bmc_qr.png "Buy me a Coffee")