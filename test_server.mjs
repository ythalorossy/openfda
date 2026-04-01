import { makeOpenFDARequest } from './dist/ApiHandler.js';
import { OpenFDABuilder } from './dist/OpenFDABuilder.js';

const apiKey = process.env.OPENFDA_API_KEY;
if (!apiKey) {
  console.error('OPENFDA_API_KEY not set');
  process.exit(1);
}

// Test OpenFDABuilder
const builder = new OpenFDABuilder()
  .context('label')
  .search('openfda.brand_name:"Advil"')
  .limit(1);
const url = builder.build();
console.log('URL built correctly:', url.includes('Advil'));

// Test API call
const result = await makeOpenFDARequest(url);
if (result.error) {
  console.error('API Error:', result.error.message);
} else {
  console.log('\nAPI Response SUCCESS!');
  console.log('Brand name:', result.data?.results?.[0]?.openfda?.brand_name);
  console.log('Generic name:', result.data?.results?.[0]?.openfda?.generic_name);
}
