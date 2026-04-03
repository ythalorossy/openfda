# Tool File Organization Refactor — Design Spec

**Date:** 2026-04-03
**Status:** Approved

## Goal

Restructure `src/index.ts` (678 lines, 7 tools) into a dataset-based folder structure where each tool lives in its own file under `src/<dataset>/`.

## Structure

```
src/
├── index.ts                  # Main entry — imports & registers tools
├── drug/                     # All drug-related tools
│   ├── index.ts              # Re-exports all drug tool definitions
│   ├── get-drug-by-name.ts
│   ├── get-drug-by-generic-name.ts
│   ├── get-drug-adverse-events.ts
│   ├── get-drugs-by-manufacturer.ts
│   ├── get-drug-safety-info.ts
│   ├── get-drug-by-ndc.ts
│   └── get-drug-by-product-ndc.ts
├── device/                   # Reserved for future device tools
│   └── .gitkeep
├── food/                     # Reserved for future food tools
│   └── .gitkeep
└── utils/
    └── ndc.ts                # normalizeNDC helper (shared)
```

## Tool File Contract

Each tool file exports a single object:

```typescript
export const toolName = {
  name: string,
  description: string,
  inputSchema: z.ZodObject,
  handler: async (params) => MCPResponse,
};
```

**No self-registration.** `index.ts` controls which tools are registered, enabling selective enablement and feature flags.

## `normalizeNDC` Helper

Moved to `src/utils/ndc.ts`. Both `get-drug-by-ndc.ts` and `get-drug-by-product-ndc.ts` import from there.

## Migration Steps

1. Create `src/drug/`, `src/utils/` directories
2. Move `normalizeNDC` to `src/utils/ndc.ts`
3. Create each tool file extracting one tool from `index.ts`
4. Create `src/drug/index.ts` re-exporting all drug tools
5. Simplify `src/index.ts` to import and register tools
6. Run `npm run lint -- --fix` and `npm run typecheck`

## Tool → File Mapping

| Tool Name                   | File                                    |
| --------------------------- | --------------------------------------- |
| `get-drug-by-name`          | `src/drug/get-drug-by-name.ts`          |
| `get-drug-by-generic-name`  | `src/drug/get-drug-by-generic-name.ts`  |
| `get-drug-adverse-events`   | `src/drug/get-drug-adverse-events.ts`   |
| `get-drugs-by-manufacturer` | `src/drug/get-drugs-by-manufacturer.ts` |
| `get-drug-safety-info`      | `src/drug/get-drug-safety-info.ts`      |
| `get-drug-by-ndc`           | `src/drug/get-drug-by-ndc.ts`           |
| `get-drug-by-product-ndc`   | `src/drug/get-drug-by-product-ndc.ts`   |
