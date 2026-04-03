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
      'https://api.fda.gov/drug/label.json?api_key=TEST_API_KEY&search=openfda.brand_name:"Advil"&limit=5'
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

  it('should include undefined in URL if API key is missing', () => {
    delete process.env.OPENFDA_API_KEY;
    const builder = new OpenFDABuilder()
      .dataset('drug')
      .context('label')
      .search('some_query')
      .limit(1);
    const url = builder.build();
    expect(url).toBe(
      'https://api.fda.gov/drug/label.json?api_key=undefined&search=some_query&limit=1'
    );
  });
});
