# Tool File Organization Implementation Plan

> **For agentic workers:** Use executing-plans skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/index.ts` into dataset-based folder structure with one file per tool.

**Architecture:** Each tool exports a definition object. `index.ts` imports and registers them. `normalizeNDC` helper lives in `src/utils/ndc.ts`.

**Tech Stack:** TypeScript, MCP SDK, Zod

---

## Task 1: Create `src/utils/ndc.ts`

**Files:**

- Create: `src/utils/ndc.ts`
- Modify: `src/types.ts` (add import if needed for NDC types)

- [ ] **Step 1: Write `src/utils/ndc.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export function normalizeNDC(ndc: string): {
  productNDC: string;
  packageNDC: string | null;
  isValid: boolean;
} {
  const cleanNDC = ndc.trim().toUpperCase();

  let productNDC: string;
  let packageNDC: string | null = null;

  if (cleanNDC.includes('-')) {
    const parts = cleanNDC.split('-');

    if (parts.length === 2) {
      productNDC = cleanNDC;
      packageNDC = null;
    } else if (parts.length === 3) {
      productNDC = `${parts[0]}-${parts[1]}`;
      packageNDC = cleanNDC;
    } else {
      return { productNDC: cleanNDC, packageNDC: null, isValid: false };
    }
  } else {
    if (cleanNDC.length === 11) {
      productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
      packageNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}-${cleanNDC.substring(9, 11)}`;
    } else if (cleanNDC.length === 9) {
      productNDC = `${cleanNDC.substring(0, 5)}-${cleanNDC.substring(5, 9)}`;
      packageNDC = null;
    } else {
      return { productNDC: cleanNDC, packageNDC: null, isValid: false };
    }
  }

  const isValid = /^\d{5}-\d{4}$/.test(productNDC);

  return { productNDC, packageNDC, isValid };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/ndc.ts
git commit -m "feat: extract normalizeNDC helper to src/utils/ndc.ts"
```

---

## Task 2: Create `src/drug/get-drug-by-name.ts`

**Files:**

- Create: `src/drug/get-drug-by-name.ts`
- Reference: `src/index.ts:82-169`

- [ ] **Step 1: Write `src/drug/get-drug-by-name.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { ToolManager } from '../ToolManager.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugByName = {
  name: 'get-drug-by-name',
  description:
    'Get drug by name. Use this tool to get the drug information by name. The drug name should be the brand name. It returns the brand name, generic name, manufacturer name, product NDC, product type, route, substance name, indications and usage, warnings, do not use, ask doctor, ask doctor or pharmacist, stop use, pregnancy or breast feeding.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug name'),
  }),
  async handler({ drugName }: { drugName: string }, toolManager: ToolManager) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.brand_name:"${drugName}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      let errorMessage = `Failed to retrieve drug data for "${drugName}": ${error.message}`;

      switch (error.type) {
        case 'http':
          if (error.status === 404) {
            errorMessage += `${url}\n\nSuggestions:\n- Verify the exact brand name spelling\n- Try searching for the generic name instead\n- Check if the drug is FDA-approved`;
          } else if (error.status === 401 || error.status === 403) {
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
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drug information found for "${drugName}". Please verify the brand name spelling or try searching for the generic name.`,
          },
        ],
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
      content: [
        {
          type: 'text',
          text: `Drug information retrieved successfully:\n\n${JSON.stringify(drugInfo, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-by-name.ts
git commit -m "feat: extract getDrugByName tool to src/drug/get-drug-by-name.ts"
```

---

## Task 3: Create `src/drug/get-drug-by-generic-name.ts`

**Files:**

- Create: `src/drug/get-drug-by-generic-name.ts`
- Reference: `src/index.ts:171-234`

- [ ] **Step 1: Write `src/drug/get-drug-by-generic-name.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugByGenericName = {
  name: 'get-drug-by-generic-name',
  description:
    'Get drug information by generic (active ingredient) name. Useful when you know the generic name but not the brand name. Returns all brand versions of the generic drug.',
  inputSchema: z.object({
    genericName: z.string().describe('Generic drug name (active ingredient)'),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum number of results to return'),
  }),
  async handler({
    genericName,
    limit,
  }: {
    genericName: string;
    limit?: number;
  }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.generic_name:"${genericName}"`)
      .limit(limit)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drug data for generic name "${genericName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drug information found for generic name "${genericName}".`,
          },
        ],
      };
    }

    const drugs = drugData.results.map((drug) => ({
      brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      manufacturer_name: drug?.openfda.manufacturer_name?.[0] || 'Unknown',
      product_type: drug?.openfda.product_type?.[0] || 'Unknown',
      route: drug?.openfda.route || [],
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${drugs.length} drug(s) with generic name "${genericName}":\n\n${JSON.stringify(drugs, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-by-generic-name.ts
git commit -m "feat: extract getDrugByGenericName tool to src/drug/get-drug-by-generic-name.ts"
```

---

## Task 4: Create `src/drug/get-drug-adverse-events.ts`

**Files:**

- Create: `src/drug/get-drug-adverse-events.ts`
- Reference: `src/index.ts:236-323`

- [ ] **Step 1: Write `src/drug/get-drug-adverse-events.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import z from 'zod';

export const getDrugAdverseEvents = {
  name: 'get-drug-adverse-events',
  description:
    'Get adverse event reports for a drug. This provides safety information about reported side effects and reactions. Use brand name or generic name.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug name (brand or generic)'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Maximum number of events to return'),
    seriousness: z
      .enum(['serious', 'non-serious', 'all'])
      .optional()
      .default('all')
      .describe('Filter by event seriousness'),
  }),
  async handler({
    drugName,
    limit,
    seriousness,
  }: {
    drugName: string;
    limit?: number;
    seriousness?: 'serious' | 'non-serious' | 'all';
  }) {
    let searchQuery = `patient.drug.medicinalproduct:"${drugName}"`;

    if (seriousness !== 'all') {
      const serious = seriousness === 'serious' ? '1' : '2';
      searchQuery += `+AND+serious:${serious}`;
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search(searchQuery)
      .limit(limit)
      .build();

    const { data: eventData, error } = await makeOpenFDARequest<any>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve adverse events for "${drugName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!eventData?.results || eventData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No adverse events found for "${drugName}".`,
          },
        ],
      };
    }

    const events = eventData.results.map((event: any) => ({
      report_id: event.safetyreportid,
      serious: event.serious === '1' ? 'Yes' : 'No',
      patient_age: event.patient?.patientonsetage || 'Unknown',
      patient_sex:
        event.patient?.patientsex === '1'
          ? 'Male'
          : event.patient?.patientsex === '2'
            ? 'Female'
            : 'Unknown',
      reactions:
        event.patient?.reaction
          ?.map((r: any) => r.reactionmeddrapt)
          .slice(0, 3) || [],
      outcomes:
        event.patient?.reaction
          ?.map((r: any) => r.reactionoutcome)
          .slice(0, 3) || [],
      report_date: event.receiptdate || 'Unknown',
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${events.length} adverse event report(s) for "${drugName}":\n\n${JSON.stringify(events, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-adverse-events.ts
git commit -m "feat: extract getDrugAdverseEvents tool to src/drug/get-drug-adverse-events.ts"
```

---

## Task 5: Create `src/drug/get-drugs-by-manufacturer.ts`

**Files:**

- Create: `src/drug/get-drugs-by-manufacturer.ts`
- Reference: `src/index.ts:325-388`

- [ ] **Step 1: Write `src/drug/get-drugs-by-manufacturer.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugsByManufacturer = {
  name: 'get-drugs-by-manufacturer',
  description:
    'Get all drugs manufactured by a specific company. Useful for finding alternatives or checking manufacturer portfolios.',
  inputSchema: z.object({
    manufacturerName: z.string().describe('Manufacturer/company name'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of drugs to return'),
  }),
  async handler({
    manufacturerName,
    limit,
  }: {
    manufacturerName: string;
    limit?: number;
  }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.manufacturer_name:"${manufacturerName}"`)
      .limit(limit)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `${url}\nFailed to retrieve drugs for manufacturer "${manufacturerName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drugs found for manufacturer "${manufacturerName}".`,
          },
        ],
      };
    }

    const drugs = drugData.results.map((drug) => ({
      brand_name: drug?.openfda.brand_name?.[0] || 'Unknown',
      generic_name: drug?.openfda.generic_name?.[0] || 'Unknown',
      product_type: drug?.openfda.product_type?.[0] || 'Unknown',
      route: drug?.openfda.route || [],
      ndc: drug?.openfda.product_ndc?.[0] || 'Unknown',
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${drugs.length} drug(s) from manufacturer "${manufacturerName}":\n\n${JSON.stringify(drugs, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drugs-by-manufacturer.ts
git commit -m "feat: extract getDrugsByManufacturer tool to src/drug/get-drugs-by-manufacturer.ts"
```

---

## Task 6: Create `src/drug/get-drug-safety-info.ts`

**Files:**

- Create: `src/drug/get-drug-safety-info.ts`
- Reference: `src/index.ts:390-456`

- [ ] **Step 1: Write `src/drug/get-drug-safety-info.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugSafetyInfo = {
  name: 'get-drug-safety-info',
  description:
    'Get comprehensive safety information for a drug including warnings, contraindications, drug interactions, and precautions. Use brand name.',
  inputSchema: z.object({
    drugName: z.string().describe('Drug brand name'),
  }),
  async handler({ drugName }: { drugName: string }) {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.brand_name:"${drugName}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve safety information for "${drugName}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No safety information found for "${drugName}".`,
          },
        ],
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
      pregnancy_or_breast_feeding: drug?.pregnancy_or_breast_feeding || [],
    };

    return {
      content: [
        {
          type: 'text',
          text: `Safety information for "${drugName}":\n\n${JSON.stringify(safetyInfo, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-safety-info.ts
git commit -m "feat: extract getDrugSafetyInfo tool to src/drug/get-drug-safety-info.ts"
```

---

## Task 7: Create `src/drug/get-drug-by-ndc.ts`

**Files:**

- Create: `src/drug/get-drug-by-ndc.ts`
- Reference: `src/index.ts:458-578`
- Depends on: `src/utils/ndc.ts`

- [ ] **Step 1: Write `src/drug/get-drug-by-ndc.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';
import { normalizeNDC } from '../utils/ndc.js';

export const getDrugByNdc = {
  name: 'get-drug-by-ndc',
  description:
    'Get drug information by National Drug Code (NDC). Accepts both product NDC (XXXXX-XXXX) and package NDC (XXXXX-XXXX-XX) formats. Also accepts NDC codes without dashes.',
  inputSchema: z.object({
    ndcCode: z
      .string()
      .describe(
        'National Drug Code (NDC) - accepts formats: XXXXX-XXXX, XXXXX-XXXX-XX, or without dashes'
      ),
  }),
  async handler({ ndcCode }: { ndcCode: string }) {
    const { productNDC, packageNDC, isValid } = normalizeNDC(ndcCode);

    if (!isValid) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid NDC format: "${ndcCode}"\n\n✅ Accepted formats:\n• Product NDC: 12345-1234\n• Package NDC: 12345-1234-01\n• Without dashes: 123451234 or 12345123401`,
          },
        ],
        isError: true,
      };
    }

    let searchQuery = `openfda.product_ndc:"${productNDC}"`;

    if (packageNDC) {
      searchQuery += `+OR+openfda.package_ndc:"${packageNDC}"`;
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(searchQuery)
      .limit(10)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve drug data for NDC "${ndcCode}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drug found with NDC "${ndcCode}" (product: ${productNDC}).\n\n💡 Tips:\n• Verify the NDC format\n• Try without the package suffix (e.g., use 12345-1234 instead of 12345-1234-01)\n• Check if this is an FDA-approved product`,
          },
        ],
      };
    }

    const results = drugData.results.map((drug) => {
      const matchingProductNDCs =
        drug.openfda.product_ndc?.filter((ndc) => ndc === productNDC) || [];

      const matchingPackageNDCs =
        drug.openfda.package_ndc?.filter((ndc) =>
          packageNDC ? ndc === packageNDC : ndc.startsWith(productNDC)
        ) || [];

      return {
        brand_name: drug.openfda.brand_name || [],
        generic_name: drug.openfda.generic_name || [],
        manufacturer_name: drug.openfda.manufacturer_name || [],
        product_type: drug.openfda.product_type || [],
        route: drug.openfda.route || [],
        substance_name: drug.openfda.substance_name || [],
        matching_product_ndc: matchingProductNDCs,
        matching_package_ndc: matchingPackageNDCs,
        all_product_ndc: drug.openfda.product_ndc || [],
        all_package_ndc: drug.openfda.package_ndc || [],
        dosage_and_administration: drug.dosage_and_administration || [],
        package_label_principal_display_panel:
          drug.package_label_principal_display_panel || [],
        active_ingredient: drug.active_ingredient || [],
        purpose: drug.purpose || [],
      };
    });

    const totalPackages = results.reduce(
      (sum, result) => sum + result.matching_package_ndc.length,
      0
    );

    const searchSummary = packageNDC
      ? `Searched for specific package NDC: ${packageNDC}`
      : `Searched for product NDC: ${productNDC} (all packages)`;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Found ${results.length} drug(s) with ${totalPackages} package(s) for NDC "${ndcCode}"\n\n${searchSummary}\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-by-ndc.ts
git commit -m "feat: extract getDrugByNdc tool to src/drug/get-drug-by-ndc.ts"
```

---

## Task 8: Create `src/drug/get-drug-by-product-ndc.ts`

**Files:**

- Create: `src/drug/get-drug-by-product-ndc.ts`
- Reference: `src/index.ts:580-667`
- Depends on: `src/utils/ndc.ts`

- [ ] **Step 1: Write `src/drug/get-drug-by-product-ndc.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import { OpenFDAResponse } from '../types.js';
import z from 'zod';
import { OpenFDABuilder } from '../OpenFDABuilder.js';
import { makeOpenFDARequest } from '../ApiHandler.js';

export const getDrugByProductNdc = {
  name: 'get-drug-by-product-ndc',
  description:
    'Get drug information by product NDC only (XXXXX-XXXX format). This ignores package variations and finds all packages for a product.',
  inputSchema: z.object({
    productNDC: z.string().describe('Product NDC in format XXXXX-XXXX'),
  }),
  async handler({ productNDC }: { productNDC: string }) {
    if (!/^\d{5}-\d{4}$/.test(productNDC.trim())) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid product NDC format: "${productNDC}"\n\n✅ Required format: XXXXX-XXXX (e.g., 12345-1234)`,
          },
        ],
        isError: true,
      };
    }

    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search(`openfda.product_ndc:"${productNDC.trim()}"`)
      .limit(1)
      .build();

    const { data: drugData, error } =
      await makeOpenFDARequest<OpenFDAResponse>(url);

    if (error) {
      return {
        content: [
          {
            type: 'text',
            text: `${url}Failed to retrieve drug data for product NDC "${productNDC}": ${error.message}`,
          },
        ],
        isError: true,
      };
    }

    if (!drugData?.results || drugData.results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No drug found with product NDC "${productNDC}".`,
          },
        ],
        structuredContent: null,
      };
    }

    const drug = drugData.results[0];

    const allPackagesForProduct =
      drug.openfda.package_ndc?.filter((ndc) =>
        ndc.startsWith(productNDC.trim())
      ) || [];

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
      dosage_and_administration: drug.dosage_and_administration || [],
    };

    return {
      content: [
        {
          type: 'text',
          text: `✅ Product NDC "${productNDC}" found with ${allPackagesForProduct.length} package variation(s):\n\n${JSON.stringify(drugInfo, null, 2)}`,
        },
      ],
    };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/get-drug-by-product-ndc.ts
git commit -m "feat: extract getDrugByProductNdc tool to src/drug/get-drug-by-product-ndc.ts"
```

---

## Task 9: Create `src/drug/index.ts`

**Files:**

- Create: `src/drug/index.ts`

- [ ] **Step 1: Write `src/drug/index.ts`**

```typescript
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

export { getDrugByName } from './get-drug-by-name.js';
export { getDrugByGenericName } from './get-drug-by-generic-name.js';
export { getDrugAdverseEvents } from './get-drug-adverse-events.js';
export { getDrugsByManufacturer } from './get-drugs-by-manufacturer.js';
export { getDrugSafetyInfo } from './get-drug-safety-info.js';
export { getDrugByNdc } from './get-drug-by-ndc.js';
export { getDrugByProductNdc } from './get-drug-by-product-ndc.js';
```

- [ ] **Step 2: Commit**

```bash
git add src/drug/index.ts
git commit -m "feat: add src/drug/index.ts re-exporting all drug tools"
```

---

## Task 10: Simplify `src/index.ts`

**Files:**

- Modify: `src/index.ts` (replace all tool definitions with imports)
- Reference: `src/index.ts:82-667`

- [ ] **Step 1: Read `src/index.ts` to get the current content**

- [ ] **Step 2: Replace tool definitions with imports and registrations**

The new `src/index.ts` should be:

```typescript
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

getDrugByName.register(toolManager);
getDrugByGenericName.register(toolManager);
getDrugAdverseEvents.register(toolManager);
getDrugsByManufacturer.register(toolManager);
getDrugSafetyInfo.register(toolManager);
getDrugByNdc.register(toolManager);
getDrugByProductNdc.register(toolManager);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenFDA MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "refactor: simplify index.ts to import and register tools from drug folder"
```

---

## Task 11: Run lint and typecheck

**Files:**

- Modify: Any files that need fixing based on lint/typecheck output

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 2: Run lint with fix**

```bash
npm run lint -- --fix
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit any remaining fixes**

```bash
git add -A && git commit -m "fix: resolve lint and typecheck issues from refactor"
```

---

## Self-Review Checklist

- [ ] All 7 tools moved to individual files under `src/drug/`
- [ ] `normalizeNDC` lives in `src/utils/ndc.ts`
- [ ] Each tool exports `{ name, description, inputSchema, handler, register }`
- [ ] `src/index.ts` only imports and registers tools — no tool logic
- [ ] `src/drug/index.ts` re-exports all tools
- [ ] `device/` and `food/` folders exist with `.gitkeep`
- [ ] All tests still pass
- [ ] Build succeeds
