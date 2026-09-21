/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */
import labelCatalog from '../../catalog/drug-label.json' with { type: 'json' };
import labelCoverage from '../../catalog/drug-label.coverage.json' with { type: 'json' };
import eventCatalog from '../../catalog/drug-event.json' with { type: 'json' };
import eventCoverage from '../../catalog/drug-event.coverage.json' with { type: 'json' };
import ndcCatalog from '../../catalog/drug-ndc.json' with { type: 'json' };
import ndcCoverage from '../../catalog/drug-ndc.coverage.json' with { type: 'json' };
import enforcementCatalog from '../../catalog/drug-enforcement.json' with { type: 'json' };
import enforcementCoverage from '../../catalog/drug-enforcement.coverage.json' with { type: 'json' };
import drugsfdaCatalog from '../../catalog/drug-drugsfda.json' with { type: 'json' };
import drugsfdaCoverage from '../../catalog/drug-drugsfda.coverage.json' with { type: 'json' };
import orangebookCatalog from '../../catalog/drug-orangebook.json' with { type: 'json' };
import orangebookCoverage from '../../catalog/drug-orangebook.coverage.json' with { type: 'json' };
import shortagesCatalog from '../../catalog/drug-shortages.json' with { type: 'json' };
import shortagesCoverage from '../../catalog/drug-shortages.coverage.json' with { type: 'json' };

interface CatalogField {
  path: string;
  type: string;
  description: string;
}
interface Catalog {
  endpoint: string;
  source_url: string;
  fetched_at: string;
  fields: CatalogField[];
}
interface Coverage {
  fields: Array<{ path: string; coverage_pct: number }>;
}

/**
 * Merge measured coverage into the published field list. Coverage is what
 * tells a model whether a field is worth searching at all: a field openFDA
 * publishes but almost never populates presents as a valid search that always
 * finds nothing.
 */
function merge(
  catalog: Catalog,
  coverage: Coverage
): Catalog & { fields: Array<CatalogField & { coverage_pct: number | null }> } {
  const byPath = new Map(
    coverage.fields.map((field) => [field.path, field.coverage_pct])
  );
  return {
    ...catalog,
    fields: catalog.fields.map((field) => ({
      ...field,
      coverage_pct: byPath.get(field.path) ?? null,
    })),
  };
}

export const DRUG_CATALOGS: Record<string, unknown> = {
  'drug-label': merge(labelCatalog as Catalog, labelCoverage as Coverage),
  'drug-event': merge(eventCatalog as Catalog, eventCoverage as Coverage),
  'drug-ndc': merge(ndcCatalog as Catalog, ndcCoverage as Coverage),
  'drug-enforcement': merge(
    enforcementCatalog as Catalog,
    enforcementCoverage as Coverage
  ),
  'drug-drugsfda': merge(
    drugsfdaCatalog as Catalog,
    drugsfdaCoverage as Coverage
  ),
  'drug-orangebook': merge(
    orangebookCatalog as Catalog,
    orangebookCoverage as Coverage
  ),
  'drug-shortages': merge(
    shortagesCatalog as Catalog,
    shortagesCoverage as Coverage
  ),
};
