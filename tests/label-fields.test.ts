import { describe, it, expect } from 'vitest';
import { mapSafetyFields, mapLabelFields } from '../src/drug/label-fields';
import jantoven from './fixtures/label-jantoven.json';
import lipitor from './fixtures/label-lipitor.json';
import zoloft from './fixtures/label-zoloft.json';

describe('mapSafetyFields', () => {
  it('returns a populated boxed_warning for a drug that has one', () => {
    const mapped = mapSafetyFields(jantoven.results[0] as any);
    expect(mapped.boxed_warning.length).toBeGreaterThan(0);
  });

  it('returns an empty array, not a missing key, for a drug with no boxed warning', () => {
    const mapped = mapSafetyFields(lipitor.results[0] as any);
    expect(mapped).toHaveProperty('boxed_warning');
    expect(mapped.boxed_warning).toEqual([]);
  });

  it('populates warnings from the PLR warnings_and_cautions field', () => {
    const mapped = mapSafetyFields(zoloft.results[0] as any);
    expect(mapped.warnings.length).toBeGreaterThan(0);
    expect(mapped.warnings_and_cautions.length).toBeGreaterThan(0);
  });

  it('prefers the old-format warnings field when both are present', () => {
    const mapped = mapSafetyFields({
      warnings: ['old format'],
      warnings_and_cautions: ['plr format'],
    });
    expect(mapped.warnings).toEqual(['old format']);
    expect(mapped.warnings_and_cautions).toEqual(['plr format']);
  });

  it('defaults every key to an empty array for an empty label', () => {
    const mapped = mapSafetyFields({});
    for (const [key, value] of Object.entries(mapped)) {
      expect(value, `${key} should default to []`).toEqual([]);
    }
  });
});

describe('mapLabelFields', () => {
  it('always includes the five fields the tool description promises', () => {
    const mapped = mapLabelFields({});
    expect(mapped).toHaveProperty('warnings', []);
    expect(mapped).toHaveProperty('do_not_use', []);
    expect(mapped).toHaveProperty('ask_doctor', []);
    expect(mapped).toHaveProperty('stop_use', []);
    expect(mapped).toHaveProperty('pregnancy_or_breast_feeding', []);
  });

  it('includes boxed_warning so a consumer can see it is absent', () => {
    expect(mapLabelFields({})).toHaveProperty('boxed_warning', []);
  });
});
