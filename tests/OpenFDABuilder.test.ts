import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenFDABuilder } from '../src/OpenFDABuilder';

describe('OpenFDABuilder', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENFDA_API_KEY: 'TEST_API_KEY' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should build a valid URL with all parameters', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .limit(5)
      .build();
    expect(url).toBe(
      'https://api.fda.gov/drug/label.json?api_key=TEST_API_KEY&search=openfda.brand_name%3A%22Advil%22&limit=5'
    );
  });

  it('should use a default limit of 1 if not specified', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .build();
    expect(url).toContain('&limit=1');
  });

  it('should throw an error if context is not set', () => {
    expect(() => {
      new OpenFDABuilder().dataset('drug').search('test').limit(1).build();
    }).toThrow('Missing required parameters: dataset, endpoint or search');
  });

  it('should throw an error if search is not set', () => {
    expect(() => {
      new OpenFDABuilder().dataset('drug').context('label').limit(1).build();
    }).toThrow('Missing required parameters: dataset, endpoint or search');
  });

  it('should handle a limit of 0', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .limit(0)
      .build();
    expect(url).toContain('&limit=0');
  });

  it('omits api_key entirely when running keyless', () => {
    delete process.env.OPENFDA_API_KEY;
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .limit(1)
      .build();
    expect(url).not.toContain('api_key');
    expect(url).toBe(
      'https://api.fda.gov/drug/label.json?search=some_query&limit=1'
    );
  });

  it('never emits the literal string api_key=undefined', () => {
    delete process.env.OPENFDA_API_KEY;
    process.env.OPENFDA_ALLOW_KEYLESS = '1';
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .build();
    expect(url).not.toContain('undefined');
  });

  it('percent-encodes quotes and colons in the search query', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Advil"')
      .build();
    expect(url).toContain('search=openfda.brand_name%3A%22Advil%22');
  });

  it('encodes a drug name containing an ampersand without corrupting the query', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('openfda.brand_name:"Tylenol & Codeine"')
      .build();
    expect(url).toContain('%26');
    // the ampersand must not start a new query parameter
    expect(url.split('&').length).toBe(3); // api_key, search, limit
  });

  it('encodes a space-separated AND filter as +AND+ on the wire', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('patient.drug.medicinalproduct:"x" AND serious:1')
      .build();
    expect(url).toContain('+AND+');
    expect(url).not.toContain('%2BAND%2B');
  });

  it('omits count, skip and sort when they are not set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .build();
    expect(url).not.toContain('count=');
    expect(url).not.toContain('skip=');
    expect(url).not.toContain('sort=');
  });

  it('emits count when set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .count('patient.reaction.reactionmeddrapt.exact')
      .build();
    expect(url).toContain(
      'count=patient.reaction.reactionmeddrapt.exact'
    );
  });

  it('emits skip and sort when set', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('x')
      .skip(20)
      .sort('receivedate:desc')
      .build();
    expect(url).toContain('skip=20');
    expect(url).toContain('sort=receivedate%3Adesc');
  });

  it('still encodes the search query when the new params are present', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .context('event')
      .search('a:"x" OR b:"y"')
      .skip(5)
      .build();
    expect(url).toContain('+OR+');
    expect(url).not.toContain('%2BOR%2B');
  });
});

describe('dataset and endpoint are open, not a fixed union', () => {
  it('builds a URL for an endpoint the drug tools never used', () => {
    const url = new OpenFDABuilder()
      .dataset('drug')
      .endpoint('enforcement')
      .search('classification:"Class I"')
      .limit(3)
      .build();
    expect(url).toContain('https://api.fda.gov/drug/enforcement.json?');
    expect(url).toContain('search=classification%3A%22Class+I%22');
    expect(url).toContain('limit=3');
  });

  it('builds a URL for a future dataset without a code change', () => {
    const url = new OpenFDABuilder()
      .dataset('food')
      .endpoint('enforcement')
      .search('state:"CA"')
      .build();
    expect(url).toContain('https://api.fda.gov/food/enforcement.json?');
  });

  it('keeps context() working as an alias while the 1.x tools still exist', () => {
    const viaContext = new OpenFDABuilder().dataset('drug').context('label').search('a:"b"').build();
    const viaEndpoint = new OpenFDABuilder().dataset('drug').endpoint('label').search('a:"b"').build();
    expect(viaContext).toBe(viaEndpoint);
  });
});
