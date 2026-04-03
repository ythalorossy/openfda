# get-drugsfda Tool Design Specification

**Date:** 2026-04-03
**Tool:** get-drugsfda

## Overview

Add a new MCP tool `get-drugsfda` that queries the OpenFDA drugsfda endpoint using flexible section/field/search parameters.

## Context

The existing `OpenFDABuilder` class only supports `ndc`, `label`, and `event` context types. The drugsfda endpoint requires a new context type.

## Changes

### 1. Extend ContextType (`src/OpenFDABuilder.ts`)

Add `drugsfda` to the `ContextType` union:

```typescript
type ContextType = 'ndc' | 'label' | 'event' | 'drugsfda';
```

### 2. Create Tool (`src/drug/get-drugsfda.ts`)

New tool with the following interface:

**inputSchema:**

```typescript
z.object({
  sectionName: z
    .string()
    .describe(
      'Section within drugsfda. Valid values: application, openfda, products, submissions, application_docs'
    ),
  fieldName: z
    .string()
    .describe(
      'Field name within the selected section. ' +
        'application: application_number. ' +
        'openfda: application_number, brand_name, generic_name, manufacturer_name, nui, package_ndc, pharm_class_cs, pharm_class_epc, pharm_class_pe, pharm_class_moa, product_ndc, route, rxcui, spl_id, spl_set_id, substance_name, unii. ' +
        'products: active_ingredients.name, active_ingredients.strength, dosage_form, marketing_status, product_number, reference_drug, reference_standard, route, te_code. ' +
        'submissions: application_docs, review_priority, submission_class_code, submission_class_code_description, submission_number, submission_property_type.code, submission_public_notes, submission_status, submission_status_date, submission_type. ' +
        'application_docs: applications_doc_id, applications_doc_date, application_docs_title, applications_doc_type, applications_doc_url'
    ),
  searchValue: z
    .string()
    .describe('Value to search for in the specified field'),
});
```

**search construction:**

```typescript
.search(`"${fieldName}":"${searchValue}"`)
```

**URL pattern:**

```
https://api.fda.gov/drug/drugsfda.json?api_key=...&search="${fieldName}":"${searchValue}"&limit=1
```

**Handler pattern:** Follow existing tool pattern (e.g., `get-drug-by-name.ts`)

### 3. Export Tool (`src/drug/index.ts`)

Add export:

```typescript
export { getDrugsfda } from './get-drugsfda.js';
```

### 4. Register Tool (`src/index.ts`)

Add import and registration:

```typescript
import { getDrugsfda } from './drug/index.js';
// ...
toolManager.registerTool(getDrugsfda);
```

## Implementation Order

1. Extend `ContextType` in `OpenFDABuilder.ts`
2. Create `src/drug/get-drugsfda.ts`
3. Export from `src/drug/index.ts`
4. Register in `src/index.ts`
5. Run lint and typecheck
