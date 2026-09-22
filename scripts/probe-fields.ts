#!/usr/bin/env tsx
/*
 * Confirms every path a descriptor exposes actually returns data. Hits the
 * live API; NOT part of npm test.
 *
 * tests/catalog-conformance already proves a path is PUBLISHED by FDA. This
 * proves it is POPULATED — a published-but-empty field presents as a valid
 * search that always finds nothing, which is the failure mode that looks
 * exactly like absent data.
 *
 * Run through tsx against src/, NOT dist/: vite.config.ts builds a single
 * bundled dist/index.js with preserveModules: false, so dist/datasets/...
 * does not exist as separate files tsx (or anything else) could import.
 */
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index.js';
import { declaredPaths } from '../src/core/search/strategy.js';

const API_KEY = process.env.OPENFDA_API_KEY;
const PAUSE_MS = 260;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface UpstreamCount {
  meta?: { results?: { total?: number } };
}

async function existsCount(
  dataset: string,
  endpoint: string,
  path: string
): Promise<number> {
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  params.set('search', `_exists_:${path}`);
  params.set('limit', '0');
  const response = await fetch(
    `https://api.fda.gov/${dataset}/${endpoint}.json?${params}`
  );
  if (response.status === 404) return 0;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as UpstreamCount;
  return body?.meta?.results?.total ?? 0;
}

// A failed count is never recorded as 0 — that would be indistinguishable
// from a field openFDA genuinely never populates, and a falsely-zeroed field
// would be silently dropped when a later task selects fields from this data,
// with no downstream check able to notice. One retry absorbs a single
// transient blip (429/500/timeout); a second failure aborts the whole run
// loudly rather than writing coverage that looks like real data.
async function existsCountWithRetry(
  dataset: string,
  endpoint: string,
  path: string
): Promise<number> {
  try {
    return await existsCount(dataset, endpoint, path);
  } catch (firstError) {
    console.error(
      `  ${path}: ${(firstError as Error).message} — retrying once`
    );
    await sleep(RETRY_DELAY_MS);
    try {
      return await existsCount(dataset, endpoint, path);
    } catch (secondError) {
      throw new Error(`${(secondError as Error).message}`);
    }
  }
}

async function main(): Promise<void> {
  let failures = 0;
  for (const descriptor of DRUG_ENDPOINTS) {
    console.log(`\n${descriptor.toolName}`);
    const paths = [
      ...new Set([
        ...descriptor.fields.flatMap((field) => declaredPaths(field.strategy)),
        ...descriptor.countFields.map((path) => path.replace(/\.exact$/, '')),
      ]),
    ];
    for (const path of paths) {
      await sleep(PAUSE_MS);
      try {
        const docs = await existsCountWithRetry(
          descriptor.dataset,
          descriptor.endpoint,
          path
        );
        const ok = docs > 0;
        if (!ok) failures += 1;
        console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${path} (${docs} records)`);
      } catch (error) {
        failures += 1;
        console.log(`  FAIL ${path} (${(error as Error).message})`);
      }
    }
  }
  console.log(
    failures === 0
      ? '\nall exposed paths return data'
      : `\n${failures} path(s) returned nothing`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
