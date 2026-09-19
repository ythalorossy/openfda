// Manual. Re-validates every FAERS code map against openFDA's published field
// reference. The probe pattern is what caught six fabricated query paths in
// the previous release.
// Run: node scripts/probe-faers-codes.mjs
import { readFileSync } from 'node:fs';

const YAML = 'https://open.fda.gov/fields/drugevent.yaml';
const source = readFileSync('src/drug/faers.ts', 'utf8');

// Pull each map's literal entries out of the TypeScript source.
const readMap = (name) => {
  const start = source.indexOf(`export const ${name}: Record<string, string> = {`);
  if (start < 0) throw new Error(`map ${name} not found in faers.ts`);
  const body = source.slice(start, source.indexOf('};', start));
  return Object.fromEntries(
    [...body.matchAll(/'(\d+)':\s*'([^']*)'/g)].map((m) => [m[1], m[2]])
  );
};

const text = await (await fetch(YAML)).text();

// Extract the possible_values block that follows a field name in the YAML.
const documented = (fieldKey) => {
  const i = text.indexOf(`${fieldKey}:`);
  if (i < 0) return null;
  const chunk = text.slice(i, i + 1200);
  const pv = chunk.indexOf('possible_values');
  if (pv < 0) return null;
  return Object.fromEntries(
    [...chunk.slice(pv, pv + 900).matchAll(/'(\d+)':\s*"([^"]*)"/g)].map((m) => [
      m[1],
      m[2],
    ])
  );
};

const CHECKS = [
  ['SERIOUSNESS', 'serious'],
  ['PATIENT_SEX', 'patientsex'],
  ['REACTION_OUTCOMES', 'reactionoutcome'],
];

let bad = 0;
for (const [mapName, fieldKey] of CHECKS) {
  const ours = readMap(mapName);
  const theirs = documented(fieldKey);
  if (!theirs) {
    console.log(`  BAD  ${mapName}: could not read possible_values for ${fieldKey}`);
    bad += 1;
    continue;
  }
  const ourCodes = Object.keys(ours).sort().join(',');
  const theirCodes = Object.keys(theirs).sort().join(',');
  const ok = ourCodes === theirCodes;
  if (!ok) bad += 1;
  console.log(`  ${ok ? 'ok  ' : 'BAD '} ${mapName.padEnd(18)} codes ours=[${ourCodes}] documented=[${theirCodes}]`);
  for (const [code, label] of Object.entries(ours)) {
    console.log(`         ${code} -> "${label}"   documented: "${(theirs[code] ?? '(absent)').slice(0, 70)}"`);
  }
}

console.log(`\n${CHECKS.length} maps probed, ${bad} mismatched`);
process.exit(bad === 0 ? 0 : 1);
