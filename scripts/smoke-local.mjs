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
  return res?.result?.content?.[0]?.text ?? JSON.stringify(res?.error ?? res);
};

const show = (label, text, checks) => {
  console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}`);
  for (const [desc, ok] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${desc}`);
  }
  console.log('  ---- first 320 chars of output ----');
  console.log('  ' + text.slice(0, 320).replace(/\n/g, '\n  '));
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
    const t = await call('get-drug-by-name', { drugName: 'Lipitor' });
    show('P0-2  missing key -> actionable error, no network call', t, [
      ['says the key is not set', /OPENFDA_API_KEY is not set/.test(t)],
      ['explains .env is not read', /\.env file is not loaded/i.test(t)],
      ['mentions the opt-in', /OPENFDA_ALLOW_KEYLESS=1/.test(t)],
      ['does NOT say "Forbidden"', !/Forbidden/.test(t)],
    ]);
    child.kill();
    return;
  }

  let t = await call('get-drug-safety-info', { drugName: 'Jantoven' });
  show('P1-1  Jantoven -> populated boxed_warning', t, [
    ['boxed_warning key present', /"boxed_warning"/.test(t)],
    ['boxed_warning is NOT empty', !/"boxed_warning": \[\]/.test(t)],
    ['no api_key leaked', !/api_key/.test(t)],
  ]);

  t = await call('get-drug-safety-info', { drugName: 'Lipitor' });
  show('P1-1  Lipitor (control) -> boxed_warning present but EMPTY', t, [
    ['boxed_warning key present', /"boxed_warning"/.test(t)],
    ['boxed_warning is empty []', /"boxed_warning": \[\]/.test(t)],
  ]);

  t = await call('get-drug-safety-info', { drugName: 'Zoloft' });
  show('P1-2  Zoloft (PLR label) -> warnings non-empty', t, [
    ['warnings_and_cautions present', /"warnings_and_cautions"/.test(t)],
    ['warnings is NOT empty', !/"warnings": \[\]/.test(t)],
  ]);

  t = await call('get-drug-by-name', { drugName: 'Cordarone' });
  show('P2-3  Cordarone -> resolves via a fallback tier (Task 10)', t, [
    ['matched_via reported', /"matched_via"/.test(t)],
    ['not a not-found', !/No label found/.test(t)],
  ]);

  t = await call('get-drug-by-product-ndc', { productNDC: '58151-155' });
  show('P2-1  5-3 product NDC reaches the API', t, [
    ['not rejected as invalid', !/Invalid product NDC format/.test(t)],
    ['normalized echo, not raw', !/"product_ndc": "58151155"/.test(t)],
  ]);

  t = await call('get-drug-by-product-ndc', { productNDC: '0456-4020' });
  show('4-4 product NDC (Celexa) is accepted', t, [
    ['not rejected as invalid', !/Invalid product NDC format/.test(t)],
    ['echoes the dashed form', /"product_ndc": "0456-4020"/.test(t)],
  ]);

  t = await call('get-drug-by-product-ndc', { productNDC: '58151155' });
  show('ambiguous undashed 8-digit NDC is refused, not guessed', t, [
    ['rejected', /Invalid product NDC format/.test(t)],
    ['explains the ambiguity', /ambiguous/.test(t)],
  ]);

  t = await call('get-drug-by-generic-name', { genericName: 'citalopram', limit: 3 });
  show('P2-2  totals: "Showing 3 of N", not "Found 3"', t, [
    ['uses Showing N of M', /Showing 3 of \d+/.test(t)],
    ['no "Found 3 drug(s)"', !/Found 3 drug\(s\)/.test(t)],
    ['total in payload', /"total":\s*\d+/.test(t)],
  ]);

  t = await call('get-drug-adverse-events', { drugName: 'metformin', limit: 2 });
  show('P3-4/5  FAERS codes decoded, reactions deduped', t, [
    ['decoded label present', /Recovered|Fatal|Not recovered|Unknown|Not reported/.test(t)],
    ['no bare numeric outcome', !/"outcomes": \[\s*"[1-6]"/.test(t)],
  ]);

  console.log('\nDone.\n');
  child.kill();
};

run().catch((e) => {
  console.error(e);
  child.kill();
  process.exit(1);
});
