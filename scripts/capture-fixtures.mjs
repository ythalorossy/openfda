// Manual fixture capture. Run: node scripts/capture-fixtures.mjs
// Hits the live openFDA API and writes trimmed responses to tests/fixtures/.
import { writeFileSync, mkdirSync } from 'node:fs';

const KEEP = [
  'boxed_warning',
  'warnings',
  'warnings_and_cautions',
  'contraindications',
  'drug_interactions',
  'precautions',
  'adverse_reactions',
  'overdosage',
  'do_not_use',
  'ask_doctor',
  'ask_doctor_or_pharmacist',
  'stop_use',
  'pregnancy_or_breast_feeding',
  'indications_and_usage',
  'active_ingredient',
  'purpose',
  'dosage_and_administration',
  'spl_product_data_elements',
];

const TARGETS = [
  ['label-jantoven', 'openfda.brand_name:"Jantoven"'],
  ['label-lipitor', 'openfda.brand_name:"Lipitor"'],
  ['label-zoloft', 'openfda.brand_name:"Zoloft"'],
  ['label-citalopram', 'openfda.generic_name:"citalopram"'],
];

// Truncate long narrative strings; tests care about presence, not prose.
const trim = (value) =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.slice(0, 200) : v))
    : value;

mkdirSync('tests/fixtures', { recursive: true });

for (const [name, search] of TARGETS) {
  const url =
    'https://api.fda.gov/drug/label.json?' +
    new URLSearchParams({ search, limit: '1' });
  const body = await (await fetch(url)).json();
  const source = body.results[0];

  const result = { openfda: source.openfda };
  for (const field of KEEP) {
    if (field in source) result[field] = trim(source[field]);
  }

  writeFileSync(
    `tests/fixtures/${name}.json`,
    JSON.stringify({ meta: body.meta, results: [result] }, null, 2) + '\n'
  );
  console.log(`wrote tests/fixtures/${name}.json`);
}
