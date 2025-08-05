#!/usr/bin/env node
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";
import { OpenFDABuilder } from "./OpenFDABuilder.js";
import { makeOpenFDARequest } from "./OpenFDAClient.js";
const server = new McpServer({
    name: "openfda",
    version: "1.0.0",
    description: "OpenFDA Model Context Protocol",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Helper function to normalize and validate NDC format
function normalizeNDC(ndc) {
    // Remove spaces and convert to uppercase
    const cleanNDC = ndc.trim().toUpperCase();
    // Check for different NDC formats:
    // 1. XXXXX-XXXX (product NDC)
    // 2. XXXXX-XXXX-XX (package NDC) 
    // 3. XXXXXXXXXXX (11-digit without dashes)
    // 4. XXXXXXXXX (9-digit without dashes - product only)
    let productNDC;
    let packageNDC = null;
    if (cleanNDC.includes('-')) {
        const parts = cleanNDC.split('-');
        if (parts.length === 2) {
            // Format: XXXXX-XXXX (product NDC)
            productNDC = cleanNDC;
            packageNDC = null;
        }
        else if (parts.length === 3) {
            // Format: XXXXX-XXXX-XX (package NDC)
            productNDC = `${parts[0]}-${parts[1]}`;
            packageNDC = cleanNDC;
        }
        else {
            return { productNDC: cleanNDC, packageNDC: null, isValid: false };
        }
    }
    else {
        // No dashes - need to format based on length
        if (cleanNDC.length === 11) {
            // 11-digit package NDC: XXXXXYYYYZZ -> XXXXX-YYYY-ZZ
            productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
            packageNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}-${cleanNDC.substring(9, 11)}`;
        }
        else if (cleanNDC.length === 9) {
            // 9-digit product NDC: XXXXXXXXX -> XXXXX-XXXX
            productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
            packageNDC = null;
        }
        else {
            return { productNDC: cleanNDC, packageNDC: null, isValid: false };
        }
    }
    // Basic validation
    const isValid = /^\d{5}-\d{4}$/.test(productNDC);
    return { productNDC, packageNDC, isValid };
}
server.tool("get-drug-by-name", "Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.", {
    drugName: z.string().describe("Drug name"),
}, async ({ drugName }) => {
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.brand_name:"${drugName}"`)
        .limit(1)
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        let errorMessage = `Failed to retrieve drug data for "${drugName}": ${error.message}`;
        // Provide helpful suggestions based on error type
        switch (error.type) {
            case 'http':
                if (error.status === 404) {
                    errorMessage += `\n\nSuggestions:\n- Verify the exact brand name spelling\n- Try searching for the generic name instead\n- Check if the drug is FDA-approved`;
                }
                else if (error.status === 401 || error.status === 403) {
                    errorMessage += `\n\nPlease check the API key configuration.`;
                }
                break;
            case 'network':
                errorMessage += `\n\nPlease check your internet connection and try again.`;
                break;
            case 'timeout':
                errorMessage += `\n\nThe request took too long. Please try again.`;
                break;
        }
        return {
            content: [{
                    type: "text",
                    text: errorMessage,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No drug information found for "${drugName}". Please verify the brand name spelling or try searching for the generic name.`,
                }],
        };
    }
    const drug = drugData.results[0];
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
        content: [{
                type: "text",
                text: `Drug information retrieved successfully:\n\n${JSON.stringify(drugInfo, null, 2)}`,
            }],
    };
});
server.tool("get-drug-by-generic-name", "Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.", {
    genericName: z.string().describe("Generic drug name (active ingredient)"),
    limit: z.number().optional().default(5).describe("Maximum number of results to return")
}, async ({ genericName, limit }) => {
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.generic_name:"${genericName}"`)
        .limit(limit)
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve drug data for generic name "${genericName}": ${error.message}`,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No drug information found for generic name "${genericName}".`,
                }],
        };
    }
    const drugs = drugData.results.map(drug => ({
        brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
        generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
        manufacturer_name: drug?.openfda.manufacturer_name?.[0] || 'Unknown',
        product_type: drug?.openfda.product_type?.[0] || 'Unknown',
        route: drug?.openfda.route || [],
    }));
    return {
        content: [{
                type: "text",
                text: `Found ${drugs.length} drug(s) with generic name "${genericName}":\n\n${JSON.stringify(drugs, null, 2)}`,
            }],
    };
});
server.tool("get-drug-adverse-events", "Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.", {
    drugName: z.string().describe("Drug name (brand or generic)"),
    limit: z.number().optional().default(10).describe("Maximum number of events to return"),
    seriousness: z.enum(["serious", "non-serious", "all"]).optional().default("all").describe("Filter by event seriousness")
}, async ({ drugName, limit, seriousness }) => {
    let searchQuery = `patient.drug.medicinalproduct:"${drugName}"`;
    if (seriousness !== "all") {
        const serious = seriousness === "serious" ? "1" : "2";
        searchQuery += `+AND+serious:${serious}`;
    }
    const url = new OpenFDABuilder()
        .context("event")
        .search(searchQuery)
        .limit(limit)
        .build();
    const { data: eventData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve adverse events for "${drugName}": ${error.message}`,
                }],
        };
    }
    if (!eventData || !eventData.results || eventData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No adverse events found for "${drugName}".`,
                }],
        };
    }
    const events = eventData.results.map((event) => ({
        report_id: event.safetyreportid,
        serious: event.serious === "1" ? "Yes" : "No",
        patient_age: event.patient?.patientonsetage || "Unknown",
        patient_sex: event.patient?.patientsex === "1" ? "Male" : event.patient?.patientsex === "2" ? "Female" : "Unknown",
        reactions: event.patient?.reaction?.map((r) => r.reactionmeddrapt).slice(0, 3) || [],
        outcomes: event.patient?.reaction?.map((r) => r.reactionoutcome).slice(0, 3) || [],
        report_date: event.receiptdate || "Unknown"
    }));
    return {
        content: [{
                type: "text",
                text: `Found ${events.length} adverse event report(s) for "${drugName}":\n\n${JSON.stringify(events, null, 2)}`,
            }],
    };
});
server.tool("get-drugs-by-manufacturer", "Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.", {
    manufacturerName: z.string().describe("Manufacturer/company name"),
    limit: z.number().optional().default(20).describe("Maximum number of drugs to return")
}, async ({ manufacturerName, limit }) => {
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.manufacturer_name:"${manufacturerName}"`)
        .limit(limit)
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No drugs found for manufacturer "${manufacturerName}".`,
                }],
        };
    }
    const drugs = drugData.results.map(drug => ({
        brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
        generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
        product_type: drug?.openfda.product_type?.[0] || 'Unknown',
        route: drug?.openfda.route || [],
        ndc: drug?.openfda.product_ndc?.[0] || 'Unknown'
    }));
    return {
        content: [{
                type: "text",
                text: `Found ${drugs.length} drug(s) from manufacturer "${manufacturerName}":\n\n${JSON.stringify(drugs, null, 2)}`,
            }],
    };
});
server.tool("get-drug-safety-info", "Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.", {
    drugName: z.string().describe("Drug brand name")
}, async ({ drugName }) => {
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.brand_name:"${drugName}"`)
        .limit(1)
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve safety information for "${drugName}": ${error.message}`,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No safety information found for "${drugName}".`,
                }],
        };
    }
    const drug = drugData.results[0];
    const safetyInfo = {
        drug_name: drug?.openfda.brand_name?.[0] || drugName,
        generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
        warnings: drug?.warnings || [],
        contraindications: drug?.contraindications || [],
        drug_interactions: drug?.drug_interactions || [],
        precautions: drug?.precautions || [],
        adverse_reactions: drug?.adverse_reactions || [],
        overdosage: drug?.overdosage || [],
        do_not_use: drug?.do_not_use || [],
        ask_doctor: drug?.ask_doctor || [],
        stop_use: drug?.stop_use || [],
        pregnancy_or_breast_feeding: drug?.pregnancy_or_breast_feeding || []
    };
    return {
        content: [{
                type: "text",
                text: `Safety information for "${drugName}":\n\n${JSON.stringify(safetyInfo, null, 2)}`,
            }],
    };
});
server.tool("get-drug-by-ndc", "Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.", {
    ndcCode: z.string().describe("National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes")
}, async ({ ndcCode }) => {
    const { productNDC, packageNDC, isValid } = normalizeNDC(ndcCode);
    if (!isValid) {
        return {
            content: [{
                    type: "text",
                    text: `Invalid NDC format: "${ndcCode}"\n\n✅ Accepted formats:\n• Product NDC: 12345-1234\n• Package NDC: 12345-1234-01\n• Without dashes: 123451234 or 12345123401`,
                }],
        };
    }
    console.log(`Searching for NDC: input="${ndcCode}", productNDC="${productNDC}", packageNDC="${packageNDC}"`);
    // Try searching by product NDC first (most flexible)
    let searchQuery = `openfda.product_ndc:"${productNDC}"`;
    // If a specific package was requested, also search package NDC
    if (packageNDC) {
        searchQuery += `+OR+openfda.package_ndc:"${packageNDC}"`;
    }
    const url = new OpenFDABuilder()
        .context("label")
        .search(searchQuery)
        .limit(10) // Get multiple results since product NDC might have multiple packages
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve drug data for NDC "${ndcCode}": ${error.message}`,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No drug found with NDC "${ndcCode}" (product: ${productNDC}).\n\n💡 Tips:\n• Verify the NDC format\n• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)\n• Check if this is an FDA-approved product`,
                }],
        };
    }
    // Process results and group by product
    const results = drugData.results.map(drug => {
        const matchingProductNDCs = drug.openfda.product_ndc?.filter(ndc => ndc === productNDC) || [];
        const matchingPackageNDCs = drug.openfda.package_ndc?.filter(ndc => packageNDC ? ndc === packageNDC : ndc.startsWith(productNDC)) || [];
        return {
            // Basic drug information
            brand_name: drug.openfda.brand_name || [],
            generic_name: drug.openfda.generic_name || [],
            manufacturer_name: drug.openfda.manufacturer_name || [],
            product_type: drug.openfda.product_type || [],
            route: drug.openfda.route || [],
            substance_name: drug.openfda.substance_name || [],
            // NDC information
            matching_product_ndc: matchingProductNDCs,
            matching_package_ndc: matchingPackageNDCs,
            all_product_ndc: drug.openfda.product_ndc || [],
            all_package_ndc: drug.openfda.package_ndc || [],
            // Additional product details
            dosage_and_administration: drug.dosage_and_administration || [],
            package_label_principal_display_panel: drug.package_label_principal_display_panel || [],
            active_ingredient: drug.active_ingredient || [],
            purpose: drug.purpose || []
        };
    });
    // Summary information
    const totalPackages = results.reduce((sum, result) => sum + result.matching_package_ndc.length, 0);
    const searchSummary = packageNDC
        ? `Searched for specific package NDC: ${packageNDC}`
        : `Searched for product NDC: ${productNDC} (all packages)`;
    return {
        content: [{
                type: "text",
                text: `✅ Found ${results.length} drug(s) with ${totalPackages} package(s) for NDC "${ndcCode}"\n\n${searchSummary}\n\n${JSON.stringify(results, null, 2)}`,
            }],
    };
});
// Alternative: Simple product-only NDC search tool
server.tool("get-drug-by-product-ndc", "Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.", {
    productNDC: z.string().describe("Product NDC in format XXXXX-XXXX")
}, async ({ productNDC }) => {
    // Validate product NDC format
    if (!/^\d{5}-\d{4}$/.test(productNDC.trim())) {
        return {
            content: [{
                    type: "text",
                    text: `Invalid product NDC format: "${productNDC}"\n\n✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`,
                }],
        };
    }
    const url = new OpenFDABuilder()
        .context("label")
        .search(`openfda.product_ndc:"${productNDC.trim()}"`)
        .limit(1)
        .build();
    const { data: drugData, error } = await makeOpenFDARequest(url);
    if (error) {
        return {
            content: [{
                    type: "text",
                    text: `Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
                }],
        };
    }
    if (!drugData || !drugData.results || drugData.results.length === 0) {
        return {
            content: [{
                    type: "text",
                    text: `No drug found with product NDC "${productNDC}".`,
                }],
        };
    }
    const drug = drugData.results[0];
    // Get all packages for this product
    const allPackagesForProduct = drug.openfda.package_ndc?.filter(ndc => ndc.startsWith(productNDC.trim())) || [];
    const drugInfo = {
        product_ndc: productNDC,
        available_packages: allPackagesForProduct,
        brand_name: drug.openfda.brand_name || [],
        generic_name: drug.openfda.generic_name || [],
        manufacturer_name: drug.openfda.manufacturer_name || [],
        product_type: drug.openfda.product_type || [],
        route: drug.openfda.route || [],
        substance_name: drug.openfda.substance_name || [],
        active_ingredient: drug.active_ingredient || [],
        purpose: drug.purpose || [],
        dosage_and_administration: drug.dosage_and_administration || []
    };
    return {
        content: [{
                type: "text",
                text: `✅ Product NDC "${productNDC}" found with ${allPackagesForProduct.length} package variation(s):\n\n${JSON.stringify(drugInfo, null, 2)}`,
            }],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("OpenFDA MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
