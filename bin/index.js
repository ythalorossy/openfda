#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import z from "zod";
import { OpenFDABuilder } from "./OpenFDABuilder.js";
dotenv.config();
const USER_AGENT = "openfda-mcp/1.0";
const server = new McpServer({
    name: "openfda",
    version: "1.0.0",
    description: "OpenFDA Model Context Protocol",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Helper function for making OpenFDA API requests
async function makeOpenFDARequest(url) {
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
// Tool: get-drug-by-name
// Description: Retrieves drug information from the OpenFDA API by brand name.
// Input: drugName (string) - The brand name of the drug to search for.
// Output: Returns key drug information fields such as brand name, generic name, manufacturer, NDC, product type, route, substance name, indications and usage, warnings, and other safety information.
// Usage: Use this tool to look up detailed drug label data for a given brand name.
server.tool("get-drug-by-name", "Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.", {
    drugName: z.string().describe("Drug name"),
}, async ({ drugName }) => {
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.brand_name:"${drugName}"`)
        .limit(1)
        .build();
    const drugData = await makeOpenFDARequest(url);
    if (!drugData) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve drug data for ${drugName}`,
                },
            ],
        };
    }
    const drug = drugData.results.at(0);
    const drugInfo = {
        brand_name: drug?.openfda.brand_name,
        generic_name: drug?.openfda.generic_name,
        manufacturer_name: drug?.openfda.manufacturer_name,
        product_ndc: drug?.openfda.product_ndc,
        product_type: drug?.openfda.product_type,
        route: drug?.openfda.route,
        substance_name: drug?.openfda.substance_name,
        indications_and_usage: drug?.indications_and_usage,
        warnings: drug?.warnings,
        do_not_use: drug?.do_not_use,
        ask_doctor: drug?.ask_doctor,
        ask_doctor_or_pharmacist: drug?.ask_doctor_or_pharmacist,
        stop_use: drug?.stop_use,
        pregnancy_or_breast_feeding: drug?.pregnancy_or_breast_feeding,
    };
    return {
        content: [
            {
                type: "text",
                text: `drug: ${JSON.stringify(drugInfo)}`,
            },
        ],
    };
});
// The above code registers a tool named "get-drug-by-name" with the MCP server.
// This tool allows users to retrieve detailed drug label information from the OpenFDA API
// by providing a brand name. It constructs the appropriate API request, fetches the data,
// and returns key drug information fields in a structured text response.
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("OpenFDA MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
