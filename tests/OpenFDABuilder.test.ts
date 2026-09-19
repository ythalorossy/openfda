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
    }).toThrow('Missing required parameters: context or search');
  });

  it('should throw an error if search is not set', () => {
    expect(() => {
      new OpenFDABuilder().dataset('drug').context('label').limit(1).build();
    }).toThrow('Missing required parameters: context or search');
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
});
