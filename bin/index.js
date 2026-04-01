var D = Object.defineProperty;
var v = (t, n, r) => n in t ? D(t, n, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[n] = r;
var k = (t, n, r) => v(t, typeof n != "symbol" ? n + "" : n, r);
import { McpServer as N } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport as T } from "@modelcontextprotocol/sdk/server/stdio.js";
import u from "zod";
class h {
  constructor() {
    k(this, "url", "https://api.fda.gov/drug/");
    k(this, "params", /* @__PURE__ */ new Map());
  }
  context(n) {
    return this.params.set("context", n), this;
  }
  search(n) {
    return this.params.set("search", n), this;
  }
  limit(n = 1) {
    return this.params.set("limit", n), this;
  }
  build() {
    const n = this.params.get("context"), r = this.params.get("search");
    let s = this.params.get("limit");
    const e = process.env.OPENFDA_API_KEY;
    if (!n || !r)
      throw new Error("Missing required parameters: context or search");
    return s === void 0 && (s = 1), `${this.url}${n}.json?api_key=${e}&search=${r}&limit=${s}`;
  }
}
class C {
  constructor(n) {
    this.server = n;
  }
  registerTool(n) {
    this.server.tool(
      n.name,
      n.description,
      n.schema.shape,
      n.handler
    );
  }
}
const F = {
  maxRetries: 3,
  retryDelay: 1e3,
  // 1 second
  timeout: 3e4
  // 30 seconds
};
function x(t) {
  return !!(t.name === "TypeError" && t.message.includes("fetch") || t.name === "AbortError" || t.status >= 500 && t.status <= 599 || t.status === 429);
}
function w(t) {
  return new Promise((n) => setTimeout(n, t));
}
async function y(t, n = {}) {
  const { maxRetries: r, retryDelay: s, timeout: e } = { ...F, ...n }, p = {
    "User-Agent": "@ythalorossy/openfda",
    Accept: "application/json"
  };
  let a = null;
  for (let c = 0; c <= r; c++)
    try {
      const o = new AbortController(), d = setTimeout(() => o.abort(), e);
      console.log(
        `Making OpenFDA request (attempt ${c + 1}/${r + 1}): ${t}`
      );
      const i = await fetch(t, {
        headers: p,
        signal: o.signal
      });
      if (clearTimeout(d), !i.ok) {
        const m = await i.text().catch(() => "Unable to read error response"), f = {
          type: "http",
          message: `HTTP ${i.status}: ${i.statusText}`,
          status: i.status,
          details: m
        };
        switch (console.error(`OpenFDA HTTP Error (${i.status}):`, {
          url: t,
          status: i.status,
          statusText: i.statusText,
          errorText: m.substring(0, 200)
          // Truncate long error messages
        }), i.status) {
          case 400:
            f.message = "Bad Request: Invalid search query or parameters";
            break;
          case 401:
            f.message = "Unauthorized: Invalid or missing API key";
            break;
          case 403:
            f.message = "Forbidden: API key may be invalid or quota exceeded";
            break;
          case 404:
            f.message = "Not Found: No results found for the specified query";
            break;
          case 429:
            f.message = "Rate Limited: Too many requests. Retrying...";
            break;
          case 500:
            f.message = "Server Error: OpenFDA service is experiencing issues";
            break;
          default:
            f.message = `HTTP Error ${i.status}: ${i.statusText}`;
        }
        if (a = f, i.status >= 400 && i.status < 500 && i.status !== 429)
          break;
        if (c < r && x({ status: i.status })) {
          const g = s * Math.pow(2, c);
          console.log(`Retrying in ${g}ms...`), await w(g);
          continue;
        }
        break;
      }
      let l;
      try {
        l = await i.json();
      } catch (m) {
        const f = {
          type: "parsing",
          message: `Failed to parse JSON response: ${m instanceof Error ? m.message : "Unknown parsing error"}`,
          details: m
        };
        console.error("OpenFDA JSON Parsing Error:", {
          url: t,
          parseError: m instanceof Error ? m.message : m
        }), a = f;
        break;
      }
      if (!l) {
        a = {
          type: "empty_response",
          message: "Received empty response from OpenFDA API"
        };
        break;
      }
      return console.log(`OpenFDA request successful on attempt ${c + 1}`), { data: l, error: null };
    } catch (o) {
      let d;
      if (o.name === "AbortError" ? d = {
        type: "timeout",
        message: `Request timeout after ${e}ms`,
        details: o
      } : o instanceof TypeError && o.message.includes("fetch") ? d = {
        type: "network",
        message: "Network error: Unable to connect to OpenFDA API",
        details: o.message
      } : d = {
        type: "unknown",
        message: `Unexpected error: ${o.message || "Unknown error occurred"}`,
        details: o
      }, console.error(`OpenFDA Request Error (attempt ${c + 1}):`, {
        url: t,
        error: o.message,
        type: o.name
      }), a = d, c < r && x(o)) {
        const i = s * Math.pow(2, c);
        console.log(`Network error, retrying in ${i}ms...`), await w(i);
        continue;
      }
      break;
    }
  return { data: null, error: a };
}
const X = new N(
  {
    name: "openfda",
    version: "1.0.0",
    description: "OpenFDA Model Context Protocol"
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
), b = new C(X);
function A(t) {
  const n = t.trim().toUpperCase();
  let r, s = null;
  if (n.includes("-")) {
    const p = n.split("-");
    if (p.length === 2)
      r = n, s = null;
    else if (p.length === 3)
      r = `${p[0]}-${p[1]}`, s = n;
    else
      return { productNDC: n, packageNDC: null, isValid: !1 };
  } else if (n.length === 11)
    r = `${n.substring(0, 5)}-${n.substring(5, 9)}`, s = `${n.substring(0, 5)}-${n.substring(5, 9)}-${n.substring(9, 11)}`;
  else if (n.length === 9)
    r = `${n.substring(0, 5)}-${n.substring(5, 9)}`, s = null;
  else
    return { productNDC: n, packageNDC: null, isValid: !1 };
  const e = /^\d{5}-\d{4}$/.test(r);
  return { productNDC: r, packageNDC: s, isValid: e };
}
b.registerTool({
  name: "get-drug-by-name",
  description: "Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.",
  schema: u.object({
    drugName: u.string().describe("Drug name")
  }),
  handler: async ({ drugName: t }) => {
    const n = new h().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: s } = await y(n);
    if (s) {
      let a = `Failed to retrieve drug data for "${t}": ${s.message}`;
      switch (s.type) {
        case "http":
          s.status === 404 ? a += `

Suggestions:
- Verify the exact brand name spelling
- Try searching for the generic name instead
- Check if the drug is FDA-approved` : (s.status === 401 || s.status === 403) && (a += `

Please check the API key configuration.`);
          break;
        case "network":
          a += `

Please check your internet connection and try again.`;
          break;
        case "timeout":
          a += `

The request took too long. Please try again.`;
          break;
      }
      return {
        content: [
          {
            type: "text",
            text: a
          }
        ]
      };
    }
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug information found for "${t}". Please verify the brand name spelling or try searching for the generic name.`
          }
        ]
      };
    const e = r.results[0], p = {
      brand_name: e == null ? void 0 : e.openfda.brand_name,
      generic_name: e == null ? void 0 : e.openfda.generic_name,
      manufacturer_name: e == null ? void 0 : e.openfda.manufacturer_name,
      product_ndc: e == null ? void 0 : e.openfda.product_ndc,
      product_type: e == null ? void 0 : e.openfda.product_type,
      route: e == null ? void 0 : e.openfda.route,
      substance_name: e == null ? void 0 : e.openfda.substance_name,
      indications_and_usage: e == null ? void 0 : e.indications_and_usage,
      warnings: e == null ? void 0 : e.warnings,
      do_not_use: e == null ? void 0 : e.do_not_use,
      ask_doctor: e == null ? void 0 : e.ask_doctor,
      ask_doctor_or_pharmacist: e == null ? void 0 : e.ask_doctor_or_pharmacist,
      stop_use: e == null ? void 0 : e.stop_use,
      pregnancy_or_breast_feeding: e == null ? void 0 : e.pregnancy_or_breast_feeding
    };
    return {
      content: [
        {
          type: "text",
          text: `Drug information retrieved successfully:

${JSON.stringify(p, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drug-by-generic-name",
  description: "Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.",
  schema: u.object({
    genericName: u.string().describe("Generic drug name (active ingredient)"),
    limit: u.number().optional().default(5).describe("Maximum number of results to return")
  }),
  handler: async ({ genericName: t, limit: n }) => {
    const r = new h().context("label").search(`openfda.generic_name:"${t}"`).limit(n).build(), { data: s, error: e } = await y(r);
    if (e)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for generic name "${t}": ${e.message}`
          }
        ]
      };
    if (!s || !s.results || s.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug information found for generic name "${t}".`
          }
        ]
      };
    const p = s.results.map((a) => {
      var c, o, d, i;
      return {
        brand_name: ((c = a == null ? void 0 : a.openfda.brand_name) == null ? void 0 : c[0]) || "Unknown",
        generic_name: ((o = a == null ? void 0 : a.openfda.generic_name) == null ? void 0 : o[0]) || "Unknown",
        manufacturer_name: ((d = a == null ? void 0 : a.openfda.manufacturer_name) == null ? void 0 : d[0]) || "Unknown",
        product_type: ((i = a == null ? void 0 : a.openfda.product_type) == null ? void 0 : i[0]) || "Unknown",
        route: (a == null ? void 0 : a.openfda.route) || []
      };
    });
    return {
      content: [
        {
          type: "text",
          text: `Found ${p.length} drug(s) with generic name "${t}":

${JSON.stringify(p, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drug-adverse-events",
  description: "Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.",
  schema: u.object({
    drugName: u.string().describe("Drug name (brand or generic)"),
    limit: u.number().optional().default(10).describe("Maximum number of events to return"),
    seriousness: u.enum(["serious", "non-serious", "all"]).optional().default("all").describe("Filter by event seriousness")
  }),
  handler: async ({ drugName: t, limit: n, seriousness: r }) => {
    let s = `patient.drug.medicinalproduct:"${t}"`;
    r !== "all" && (s += `+AND+serious:${r === "serious" ? "1" : "2"}`);
    const e = new h().context("event").search(s).limit(n).build(), { data: p, error: a } = await y(e);
    if (a)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve adverse events for "${t}": ${a.message}`
          }
        ]
      };
    if (!p || !p.results || p.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No adverse events found for "${t}".`
          }
        ]
      };
    const c = p.results.map((o) => {
      var d, i, l, m, f, g, $;
      return {
        report_id: o.safetyreportid,
        serious: o.serious === "1" ? "Yes" : "No",
        patient_age: ((d = o.patient) == null ? void 0 : d.patientonsetage) || "Unknown",
        patient_sex: ((i = o.patient) == null ? void 0 : i.patientsex) === "1" ? "Male" : ((l = o.patient) == null ? void 0 : l.patientsex) === "2" ? "Female" : "Unknown",
        reactions: ((f = (m = o.patient) == null ? void 0 : m.reaction) == null ? void 0 : f.map((_) => _.reactionmeddrapt).slice(0, 3)) || [],
        outcomes: (($ = (g = o.patient) == null ? void 0 : g.reaction) == null ? void 0 : $.map((_) => _.reactionoutcome).slice(0, 3)) || [],
        report_date: o.receiptdate || "Unknown"
      };
    });
    return {
      content: [
        {
          type: "text",
          text: `Found ${c.length} adverse event report(s) for "${t}":

${JSON.stringify(c, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drugs-by-manufacturer",
  description: "Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.",
  schema: u.object({
    manufacturerName: u.string().describe("Manufacturer/company name"),
    limit: u.number().optional().default(20).describe("Maximum number of drugs to return")
  }),
  handler: async ({ manufacturerName: t, limit: n }) => {
    const r = new h().context("label").search(`openfda.manufacturer_name:"${t}"`).limit(n).build(), { data: s, error: e } = await y(r);
    if (e)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drugs for manufacturer "${t}": ${e.message}`
          }
        ]
      };
    if (!s || !s.results || s.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drugs found for manufacturer "${t}".`
          }
        ]
      };
    const p = s.results.map((a) => {
      var c, o, d, i;
      return {
        brand_name: ((c = a == null ? void 0 : a.openfda.brand_name) == null ? void 0 : c[0]) || "Unknown",
        generic_name: ((o = a == null ? void 0 : a.openfda.generic_name) == null ? void 0 : o[0]) || "Unknown",
        product_type: ((d = a == null ? void 0 : a.openfda.product_type) == null ? void 0 : d[0]) || "Unknown",
        route: (a == null ? void 0 : a.openfda.route) || [],
        ndc: ((i = a == null ? void 0 : a.openfda.product_ndc) == null ? void 0 : i[0]) || "Unknown"
      };
    });
    return {
      content: [
        {
          type: "text",
          text: `Found ${p.length} drug(s) from manufacturer "${t}":

${JSON.stringify(p, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drug-safety-info",
  description: "Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.",
  schema: u.object({
    drugName: u.string().describe("Drug brand name")
  }),
  handler: async ({ drugName: t }) => {
    var a, c;
    const n = new h().context("label").search(`openfda.brand_name:"${t}"`).limit(1).build(), { data: r, error: s } = await y(n);
    if (s)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve safety information for "${t}": ${s.message}`
          }
        ]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No safety information found for "${t}".`
          }
        ]
      };
    const e = r.results[0], p = {
      drug_name: ((a = e == null ? void 0 : e.openfda.brand_name) == null ? void 0 : a[0]) || t,
      generic_name: ((c = e == null ? void 0 : e.openfda.generic_name) == null ? void 0 : c[0]) || "Unknown",
      warnings: (e == null ? void 0 : e.warnings) || [],
      contraindications: (e == null ? void 0 : e.contraindications) || [],
      drug_interactions: (e == null ? void 0 : e.drug_interactions) || [],
      precautions: (e == null ? void 0 : e.precautions) || [],
      adverse_reactions: (e == null ? void 0 : e.adverse_reactions) || [],
      overdosage: (e == null ? void 0 : e.overdosage) || [],
      do_not_use: (e == null ? void 0 : e.do_not_use) || [],
      ask_doctor: (e == null ? void 0 : e.ask_doctor) || [],
      stop_use: (e == null ? void 0 : e.stop_use) || [],
      pregnancy_or_breast_feeding: (e == null ? void 0 : e.pregnancy_or_breast_feeding) || []
    };
    return {
      content: [
        {
          type: "text",
          text: `Safety information for "${t}":

${JSON.stringify(p, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drug-by-ndc",
  description: "Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.",
  schema: u.object({
    ndcCode: u.string().describe(
      "National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes"
    )
  }),
  handler: async ({ ndcCode: t }) => {
    const { productNDC: n, packageNDC: r, isValid: s } = A(t);
    if (!s)
      return {
        content: [
          {
            type: "text",
            text: `Invalid NDC format: "${t}"

✅ Accepted formats:
• Product NDC: 12345-1234
• Package NDC: 12345-1234-01
• Without dashes: 123451234 or 12345123401`
          }
        ]
      };
    console.log(
      `Searching for NDC: input="${t}", productNDC="${n}", packageNDC="${r}"`
    );
    let e = `openfda.product_ndc:"${n}"`;
    r && (e += `+OR+openfda.package_ndc:"${r}"`);
    const p = new h().context("label").search(e).limit(10).build(), { data: a, error: c } = await y(p);
    if (c)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for NDC "${t}": ${c.message}`
          }
        ]
      };
    if (!a || !a.results || a.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug found with NDC "${t}" (product: ${n}).

💡 Tips:
• Verify the NDC format
• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)
• Check if this is an FDA-approved product`
          }
        ]
      };
    const o = a.results.map((l) => {
      var g, $;
      const m = ((g = l.openfda.product_ndc) == null ? void 0 : g.filter((_) => _ === n)) || [], f = (($ = l.openfda.package_ndc) == null ? void 0 : $.filter(
        (_) => r ? _ === r : _.startsWith(n)
      )) || [];
      return {
        // Basic drug information
        brand_name: l.openfda.brand_name || [],
        generic_name: l.openfda.generic_name || [],
        manufacturer_name: l.openfda.manufacturer_name || [],
        product_type: l.openfda.product_type || [],
        route: l.openfda.route || [],
        substance_name: l.openfda.substance_name || [],
        // NDC information
        matching_product_ndc: m,
        matching_package_ndc: f,
        all_product_ndc: l.openfda.product_ndc || [],
        all_package_ndc: l.openfda.package_ndc || [],
        // Additional product details
        dosage_and_administration: l.dosage_and_administration || [],
        package_label_principal_display_panel: l.package_label_principal_display_panel || [],
        active_ingredient: l.active_ingredient || [],
        purpose: l.purpose || []
      };
    }), d = o.reduce(
      (l, m) => l + m.matching_package_ndc.length,
      0
    ), i = r ? `Searched for specific package NDC: ${r}` : `Searched for product NDC: ${n} (all packages)`;
    return {
      content: [
        {
          type: "text",
          text: `✅ Found ${o.length} drug(s) with ${d} package(s) for NDC "${t}"

${i}

${JSON.stringify(o, null, 2)}`
        }
      ]
    };
  }
});
b.registerTool({
  name: "get-drug-by-product-ndc",
  description: "Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.",
  schema: u.object({
    productNDC: u.string().describe("Product NDC in format XXXXX-XXXX")
  }),
  handler: async ({ productNDC: t }) => {
    var c;
    if (!/^\d{5}-\d{4}$/.test(t.trim()))
      return {
        content: [
          {
            type: "text",
            text: `Invalid product NDC format: "${t}"

✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`
          }
        ]
      };
    const n = new h().context("label").search(`openfda.product_ndc:"${t.trim()}"`).limit(1).build(), { data: r, error: s } = await y(n);
    if (s)
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve drug data for product NDC "${t}": ${s.message}`
          }
        ]
      };
    if (!r || !r.results || r.results.length === 0)
      return {
        content: [
          {
            type: "text",
            text: `No drug found with product NDC "${t}".`
          }
        ]
      };
    const e = r.results[0], p = ((c = e.openfda.package_ndc) == null ? void 0 : c.filter(
      (o) => o.startsWith(t.trim())
    )) || [], a = {
      product_ndc: t,
      available_packages: p,
      brand_name: e.openfda.brand_name || [],
      generic_name: e.openfda.generic_name || [],
      manufacturer_name: e.openfda.manufacturer_name || [],
      product_type: e.openfda.product_type || [],
      route: e.openfda.route || [],
      substance_name: e.openfda.substance_name || [],
      active_ingredient: e.active_ingredient || [],
      purpose: e.purpose || [],
      dosage_and_administration: e.dosage_and_administration || []
    };
    return {
      content: [
        {
          type: "text",
          text: `✅ Product NDC "${t}" found with ${p.length} package variation(s):

${JSON.stringify(a, null, 2)}`
        }
      ]
    };
  }
});
async function P() {
  const t = new T();
  await X.connect(t), console.error("OpenFDA MCP Server running on stdio");
}
P().catch((t) => {
  console.error("Fatal error in main():", t), process.exit(1);
});
