#!/usr/bin/env node
/*
 * For every catalog field, asks openFDA how many records actually populate it
 * (`_exists_:<path>`). Hits the live API; NOT part of npm test.
 *
 * Coverage is what makes field selection evidence-based: a field that exists
 * but is populated in 0.3% of records presents as a valid search that always
 * finds nothing, which is worse than not offering it at all.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ENDPOINTS = ['label', 'event', 'ndc', 'enforcement', 'drugsfda', 'orangebook', 'shortages'];
const API_KEY = process.env.OPENFDA_API_KEY;
const PAUSE_MS = 260; // stay under 240 req/min with a key
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function total(endpoint, search) {
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  if (search) params.set('search', search);
  params.set('limit', '0');
  const response = await fetch(`https://api.fda.gov/drug/${endpoint}.json?${params}`);
  if (response.status === 404) return 0; // NOT_FOUND is zero matches, not an error
  if (!response.ok) throw new Error(`/drug/${endpoint}.json -> HTTP ${response.status}`);
  const body = await response.json();
  return body?.meta?.results?.total ?? 0;
}

// A failed count is never recorded as 0 — that would be indistinguishable
// from a field openFDA genuinely never populates, and a falsely-zeroed field
// would be silently dropped when a later task selects fields from this data,
// with no downstream check able to notice. One retry absorbs a single
// transient blip (429/500/timeout); a second failure aborts the whole run
// loudly rather than writing a coverage file that looks like real data.
async function totalWithRetry(endpoint, search, path) {
  try {
    return await total(endpoint, search);
  } catch (firstError) {
    console.error(`  ${path}: ${firstError.message} — retrying once`);
    await sleep(RETRY_DELAY_MS);
    try {
      return await total(endpoint, search);
    } catch (secondError) {
      console.error(
        `drug-${endpoint}: aborting — ${path} failed twice (${secondError.message}). ` +
          `No coverage file written for drug-${endpoint}.`
      );
      process.exit(1);
    }
  }
}

for (const endpoint of ENDPOINTS) {
  const catalog = JSON.parse(readFileSync(`src/catalog/drug-${endpoint}.json`, 'utf8'));
  const totalRecords = await total(endpoint, '');
  const fields = [];
  for (const field of catalog.fields) {
    await sleep(PAUSE_MS);
    const docs = await totalWithRetry(endpoint, `_exists_:${field.path}`, field.path);
    fields.push({
      path: field.path,
      docs,
      coverage_pct: totalRecords ? Math.round((docs / totalRecords) * 10000) / 100 : 0,
    });
  }
  writeFileSync(
    `src/catalog/drug-${endpoint}.coverage.json`,
    JSON.stringify(
      { endpoint, measured_at: new Date().toISOString(), total_records: totalRecords, fields },
      null,
      2
    ) + '\n'
  );
  console.log(`drug-${endpoint}: measured ${fields.length} fields over ${totalRecords} records`);
}
