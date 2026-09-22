#!/usr/bin/env node
/*
 * Copyright (c) 2025 Ythalo Saldanha
 * Licensed under the MIT License
 */

/**
 * Manual end-to-end smoke test. Drives the LOCAL build (dist/index.js) over
 * stdio exactly as an MCP client would, so it exercises the shipped artifact
 * rather than the TypeScript sources.
 *
 * Asserts behaviours of all seven tools in the 2.0.0 drug endpoint group
 * (drug-label, drug-event, drug-drugsfda, drug-ndc, drug-enforcement,
 * drug-orangebook, drug-shortages), the descriptor-built replacement for the
 * nine 1.x get-* tools.
 *
 * This HITS THE LIVE openFDA API and is NOT part of the test suite — the
 * vitest suite is fully offline. Run it by hand before publishing.
 *
 *   npm run build:cli && npm run smoke
 *   npm run smoke -- --no-key     # exercise the missing-key path instead
 *
 * The key is taken from OPENFDA_API_KEY, else from .mcp.json if one exists,
 * else the run falls back to openFDA's keyless tier.
 */

import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVER = resolve(REPO, 'dist/index.js');

if (!existsSync(SERVER)) {
  console.error(`No build found at ${SERVER}\nRun: npm run build:cli`);
  process.exit(1);
}
const forceNoKey = process.argv.includes('--no-key');

let apiKey = process.env.OPENFDA_API_KEY;
const localConfig = resolve(REPO, '.mcp.json');
if (!apiKey && existsSync(localConfig)) {
  try {
    const cfg = JSON.parse(readFileSync(localConfig, 'utf8'));
    const fromCfg = cfg?.mcpServers?.openfda?.env?.OPENFDA_API_KEY;
    // Ignore an unexpanded ${VAR} placeholder — it is not a usable key.
    if (fromCfg && !fromCfg.startsWith('$')) apiKey = fromCfg;
  } catch {}
}

const env = { ...process.env };
delete env.OPENFDA_API_KEY;
delete env.OPENFDA_ALLOW_KEYLESS;
if (forceNoKey) {
  // leave both unset: this is the fail-fast path
} else if (apiKey) {
  env.OPENFDA_API_KEY = apiKey;
} else {
  env.OPENFDA_ALLOW_KEYLESS = '1';
}

const child = spawn('node', [SERVER], { env, stdio: ['pipe', 'pipe', 'pipe'] });
child.stderr.on('data', (d) => process.stderr.write(`  [server] ${d}`));

let buf = '';
const pending = new Map();
child.stdout.on('data', (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {}
  }
});

let nextId = 1;
const send = (method, params) =>
  new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
const notify = (method, params) =>
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

const call = async (name, args) => {
  const res = await send('tools/call', { name, arguments: args });
  return {
    text: res?.result?.content?.[0]?.text ?? JSON.stringify(res?.error ?? res),
    isError: res?.result?.isError === true,
  };
};

let failures = 0;
const show = (label, text, checks) => {
  console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}`);
  for (const [desc, ok] of checks) {
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${desc}`);
  }
  console.log('  ---- first 320 chars of output ----');
  console.log('  ' + text.slice(0, 320).replace(/\n/g, '\n  '));
};

/** A response body parses as `${prose}\n\n${json}` — extract the JSON half. */
const parsePayload = (text) => {
  const start = text.indexOf('{');
  if (start < 0) return undefined;
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return undefined;
  }
};

const run = async () => {
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke', version: '1.0.0' },
  });
  notify('notifications/initialized');

  const tools = await send('tools/list', {});
  console.log(
    `\nTools registered: ${tools.result.tools.length}\n  ` +
      tools.result.tools.map((t) => t.name).join('\n  ')
  );

  if (forceNoKey) {
    const { text: t } = await call('drug-label', { value: 'Lipitor' });
    show('missing key -> actionable error, no network call', t, [
      ['says the key is not set', /OPENFDA_API_KEY is not set/.test(t)],
      ['explains .env is not read', /\.env file is not loaded/i.test(t)],
      ['mentions the opt-in', /OPENFDA_ALLOW_KEYLESS=1/.test(t)],
      ['does NOT say "Forbidden"', !/Forbidden/.test(t)],
    ]);
    child.kill();
    process.exit(failures > 0 ? 1 : 0);
  }

  // The six calls Task 19 requires, one-for-one replacing the 1.x calls
  // this script used to drive, plus one live call per net-new endpoint
  // (drug-ndc, drug-enforcement, drug-orangebook, drug-shortages) so the
  // pre-publish gate actually exercises all seven tools, not three. Search
  // values below were checked live against api.fda.gov before being picked;
  // each returns a non-trivial number of records (see
  // .superpowers/sdd/2026-09-20-openfda-api-groups/final-fix-report.md for
  // the counts), so a PASS here is evidence the tool works, not a
  // false-positive on zero rows.
  const calls = [
    { tool: 'drug-label', args: { value: 'Advil' } },
    { tool: 'drug-label', args: { value: 'Advil', detail: 'safety' } },
    { tool: 'drug-label', args: { field: 'ndc', value: '0573-0164-40' } },
    { tool: 'drug-event', args: { value: 'IBUPROFEN', limit: 2 } },
    {
      tool: 'drug-event',
      args: { value: 'IBUPROFEN', count: 'patient.reaction.reactionmeddrapt.exact' },
    },
    { tool: 'drug-drugsfda', args: { field: 'sponsor_name', value: 'Pfizer' } },
    // Default field (products.brand_name, 98.79% populated) — the exact
    // path this fix wave repointed away from the sparse openfda.brand_name.
    // Advil (18 records), not Lipitor (1 record): a single-record match
    // would flip two of the five checks to FAIL outright (no JSON payload
    // at all on a zero-hit response) if that one record is ever delisted
    // or corrected upstream.
    { tool: 'drug-drugsfda', args: { value: 'Advil' } },
    // drug-ndc: 1,484 NDC Directory listings for Ibuprofen.
    { tool: 'drug-ndc', args: { value: 'Ibuprofen' } },
    // drug-enforcement: 68 recall/enforcement reports for Ibuprofen.
    { tool: 'drug-enforcement', args: { value: 'Ibuprofen' } },
    // drug-orangebook: 4 Orange Book product entries for Lipitor.
    { tool: 'drug-orangebook', args: { value: 'Lipitor' } },
    // drug-shortages: 89 shortage reports for Lidocaine.
    { tool: 'drug-shortages', args: { value: 'Lidocaine' } },
  ];

  for (const { tool, args } of calls) {
    const { text, isError } = await call(tool, args);
    const payload = parsePayload(text);
    show(`${tool} ${JSON.stringify(args)}`, text, [
      ['is not an error', !isError],
      ['response parses as JSON', payload !== undefined],
      ['matched_via is present', payload !== undefined && 'matched_via' in payload],
      ['no api_key substring anywhere in output', !/api_key/.test(text)],
      ['no bare api.fda.gov leak', !/api\.fda\.gov/.test(text)],
    ]);
  }

  // The live proof of the 404 fix: a drug that does not exist must come back
  // as a non-error, prose "no results" message — not isError: true. This is
  // the exact regression the 1.x line's 404-classification bug produced.
  {
    const { text, isError } = await call('drug-label', { value: 'Zzzznotadrug' });
    show('drug-label nonexistent drug -> non-error no-results message', text, [
      ['is NOT an error', !isError],
      ['reads as "no records found"', /No drug-label records found/i.test(text)],
      ['no api_key substring anywhere in output', !/api_key/.test(text)],
    ]);
  }

  // The live proof of the count fix. At 2.0.0, 14 of the 30 declared count
  // fields passed schema validation and failed at the API, and no offline
  // test could see it — a green unit suite over stubs is exactly what let
  // them ship. This drives every declared count field of every tool over
  // stdio against the live API.
  {
    const COUNT_FIELDS = [
      ['drug-label', 'Advil', ['openfda.route.exact', 'openfda.product_type.exact', 'openfda.manufacturer_name.exact']],
      ['drug-event', 'IBUPROFEN', ['patient.reaction.reactionmeddrapt.exact', 'patient.reaction.reactionoutcome', 'serious', 'patient.patientsex', 'occurcountry.exact', 'patient.drug.openfda.generic_name.exact']],
      ['drug-drugsfda', 'Advil', ['sponsor_name', 'products.marketing_status', 'products.dosage_form.exact']],
      ['drug-ndc', 'ibuprofen', ['dosage_form.exact', 'route.exact', 'product_type.exact', 'marketing_category', 'openfda.manufacturer_name.exact']],
      ['drug-enforcement', 'valsartan', ['classification.exact', 'status.exact', 'state.exact', 'voluntary_mandated.exact', 'recalling_firm.exact']],
      ['drug-orangebook', 'ibuprofen', ['products.application_type', 'products.dosage_form.exact', 'products.route.exact', 'products.therapeutic_equivalence_codes']],
      ['drug-shortages', 'Dextrose', ['status', 'dosage_form.exact', 'therapeutic_category', 'company_name.exact']],
    ];
    for (const [tool, value, fields] of COUNT_FIELDS) {
      for (const count of fields) {
        const { text, isError } = await call(tool, { value, count });
        const payload = parsePayload(text);
        show(`${tool} count=${count} -> aggregates`, text, [
          ['is not an error', !isError],
          ['does not read as an outage', !/experiencing issues/.test(text)],
          ['does not read as a rejected argument', !/Cannot aggregate/.test(text)],
          ['reports what it counted by', payload !== undefined && payload.counted_by === count],
          ['reports the bucket ceiling', payload !== undefined && typeof payload.limit === 'number'],
        ]);
      }
    }
  }

  // Defect 3: limit is the RECORD ceiling, and openFDA reuses the same
  // parameter for buckets. drug-label's record default of 1 returned a
  // single bucket under a "Top 1 values" header; the reported Advil case is
  // six manufacturers summing to 39.
  {
    const { text, isError } = await call('drug-label', {
      value: 'Advil',
      count: 'openfda.manufacturer_name.exact',
    });
    const payload = parsePayload(text);
    show('drug-label count with no limit -> more than one bucket', text, [
      ['is not an error', !isError],
      ['returns more than one bucket', payload !== undefined && payload.results.length > 1],
      ['does not claim "Top 1 values"', !/Top 1 values/.test(text)],
      ['bucket ceiling defaulted to 100', payload !== undefined && payload.limit === 100],
    ]);
  }

  // Defect 1: skip += limit steps over rows the response budget dropped.
  // drug-enforcement at limit 50 is the case that actually drops rows, so
  // it is the one that proves next_skip is both present and not equal to
  // skip + limit.
  {
    const { text, isError } = await call('drug-enforcement', {
      value: 'valsartan',
      limit: 50,
    });
    const payload = parsePayload(text);
    show('drug-enforcement paging -> next_skip is sound', text, [
      ['is not an error', !isError],
      ['carries next_skip', payload !== undefined && 'next_skip' in payload],
      ['carries dropped_for_budget', payload !== undefined && 'dropped_for_budget' in payload],
      [
        'next_skip equals returned, not limit',
        payload !== undefined &&
          (payload.next_skip === null || payload.next_skip === payload.returned),
      ],
      [
        'drop count agrees with returned',
        payload !== undefined &&
          payload.returned + payload.dropped_for_budget <= 50,
      ],
    ]);
  }

  // Defect 6: the field description advertised Shortage / Resolved /
  // Discontinued. A model filtering on those found nothing and could not
  // tell that from a product genuinely not being short.
  {
    const { text, isError } = await call('drug-shortages', {
      field: 'status',
      value: 'Current',
    });
    const payload = parsePayload(text);
    show('drug-shortages status=Current -> real records', text, [
      ['is not an error', !isError],
      ['found records', payload !== undefined && payload.returned > 0],
      ['did not read as no-results', !/No drug-shortages records found/i.test(text)],
    ]);
  }

  console.log(`\nDone. ${failures} check(s) failed.\n`);
  child.kill();
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((e) => {
  console.error(e);
  child.kill();
  process.exit(1);
});
