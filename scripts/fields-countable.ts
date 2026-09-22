#!/usr/bin/env tsx
/*
 * For every countField every descriptor declares, and for its suffix
 * alternate, asks openFDA whether the path can actually be aggregated.
 * Hits the live API; NOT part of npm test.
 *
 * Countability is a property of openFDA's index mapping, separate from
 * whether a field is PUBLISHED (tests/catalog-conformance.test.ts) or
 * POPULATED (scripts/probe-fields.ts), and it has no derivable rule: of the
 * 30 fields the descriptors declared at 2.0.0, 14 were rejected upstream
 * while 16 near-identical ones were accepted. A rejected count field passes
 * schema validation and fails at the API, so the property has to be
 * measured and committed for an offline guard to check it.
 *
 * The probe is search-free on purpose: it measures the index mapping alone,
 * so the result is deterministic and independent of any search value.
 *
 * Run through tsx against src/, NOT dist/, for the same reason
 * probe-fields.ts is: vite.config.ts bundles a single dist/index.js with
 * preserveModules: false, so dist/datasets/... does not exist.
 */
import { writeFileSync } from 'node:fs';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index.js';

const API_KEY = process.env.OPENFDA_API_KEY;
const PAUSE_MS = 260; // stay under 240 req/min with a key
const RETRY_DELAY_MS = 1000;
const TOP_TERMS = 5;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * `status` <-> `status.exact`. Recording both directions is what lets the
 * offline guard name the working form instead of only reporting a failure.
 */
const alternate = (path: string): string =>
  path.endsWith('.exact') ? path.slice(0, -'.exact'.length) : `${path}.exact`;

interface Probe {
  countable: boolean;
  terms: string[];
}

/**
 * One search-free count. An upstream REJECTION is the measurement, so it
 * returns `countable: false` rather than throwing. It throws only when the
 * request could not be completed or answered in a shape we recognise, so a
 * transient blip stays distinguishable from a genuine "not countable".
 */
async function probe(endpoint: string, path: string): Promise<Probe> {
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  params.set('count', path);
  const response = await fetch(
    `https://api.fda.gov/drug/${endpoint}.json?${params}`
  );
  const text = await response.text();

  if (response.ok) {
    const body = JSON.parse(text) as {
      results?: { term: string | number; count: number }[];
    };
    const terms = (body.results ?? [])
      .slice(0, TOP_TERMS)
      .map((row) => `${row.term}=${row.count}`);
    return { countable: true, terms };
  }

  let upstream:
    | { code?: string; message?: string; details?: unknown }
    | undefined;
  try {
    upstream = (
      JSON.parse(text) as {
        error?: { code?: string; message?: string; details?: unknown };
      }
    ).error;
  } catch {
    throw new Error(`HTTP ${response.status} with a non-JSON body`);
  }

  // The two ways openFDA says "you cannot aggregate this path", verified
  // live 2026-09-21. Anything else is transient or unknown and must NOT be
  // written down as `countable: false`.
  const details = typeof upstream?.details === 'string' ? upstream.details : '';
  if (details.includes('illegal_argument_exception')) {
    return { countable: false, terms: [] };
  }
  if (
    response.status === 404 &&
    upstream?.code === 'NOT_FOUND' &&
    upstream?.message === 'Nothing to count'
  ) {
    return { countable: false, terms: [] };
  }
  throw new Error(
    `HTTP ${response.status}: ${upstream?.code} / ${upstream?.message}`
  );
}

/*
 * A failed probe is never recorded as `false` — that is indistinguishable
 * from a genuinely non-countable field, and a falsely-false entry would make
 * the offline guard reject a field that actually works. One retry absorbs a
 * single blip; a second failure aborts the run loudly rather than writing a
 * file that looks like real data.
 */
async function probeWithRetry(endpoint: string, path: string): Promise<Probe> {
  try {
    return await probe(endpoint, path);
  } catch (firstError) {
    const first = firstError instanceof Error ? firstError.message : 'unknown';
    console.error(`  ${path}: ${first} — retrying once`);
    await sleep(RETRY_DELAY_MS);
    try {
      return await probe(endpoint, path);
    } catch (secondError) {
      const second =
        secondError instanceof Error ? secondError.message : 'unknown';
      console.error(
        `drug-${endpoint}: aborting — ${path} failed twice (${second}). ` +
          `No countable file written for drug-${endpoint}.`
      );
      process.exit(1);
    }
  }
}

for (const descriptor of DRUG_ENDPOINTS) {
  const { endpoint } = descriptor;
  const candidates = [
    ...new Set(
      descriptor.countFields.flatMap((path) => [path, alternate(path)])
    ),
  ].sort();

  const countable: Record<string, boolean> = {};
  const declared = new Set<string>(descriptor.countFields);
  for (const path of candidates) {
    await sleep(PAUSE_MS);
    const result = await probeWithRetry(endpoint, path);
    countable[path] = result.countable;
    const mark = result.countable ? 'countable    ' : 'NOT countable';
    const flag = declared.has(path)
      ? result.countable
        ? ''
        : '  <-- DECLARED AND BROKEN'
      : '';
    console.log(`  ${mark} ${path}${flag}`);
    // Printed, never asserted: a unit test cannot know upstream's
    // vocabulary, and pinning these strings would fail on a legitimate
    // change without saying anything useful. The weekly fields-drift run is
    // where a vocabulary change becomes visible — this is what makes the
    // drug-shortages `status` defect (Task 8) noticeable next time.
    if (result.countable && result.terms.length > 0) {
      console.log(`      top: ${result.terms.join(' | ')}`);
    }
  }

  writeFileSync(
    `src/catalog/drug-${endpoint}.countable.json`,
    JSON.stringify(
      { endpoint, probed_at: new Date().toISOString(), countable },
      null,
      2
    ) + '\n'
  );
  const broken = descriptor.countFields.filter((path) => !countable[path]);
  console.log(
    `drug-${endpoint}: probed ${candidates.length} paths; ` +
      `${broken.length} declared countField(s) broken` +
      `${broken.length ? `: ${broken.join(', ')}` : ''}`
  );
}
