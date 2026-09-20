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

for (const endpoint of ENDPOINTS) {
  const catalog = JSON.parse(readFileSync(`src/catalog/drug-${endpoint}.json`, 'utf8'));
  const totalRecords = await total(endpoint, '');
  const fields = [];
  for (const field of catalog.fields) {
    await sleep(PAUSE_MS);
    let docs = 0;
    try {
      docs = await total(endpoint, `_exists_:${field.path}`);
    } catch (error) {
      console.error(`  ${field.path}: ${error.message}`);
    }
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
