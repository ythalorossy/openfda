import { describe, it, expect } from 'vitest';
import {
  EVENT_SEARCH_FIELDS,
  buildEventSearch,
  EVENT_MATCHED_VIA,
} from '../src/drug/event-search';

describe('buildEventSearch', () => {
  it('searches all three FAERS indexes', () => {
    expect(EVENT_SEARCH_FIELDS).toEqual([
      'patient.drug.openfda.generic_name',
      'patient.drug.openfda.substance_name',
      'patient.drug.medicinalproduct',
    ]);
  });

  it('ORs the fields with spaces, never a literal +', () => {
    const q = buildEventSearch('citalopram');
    expect(q).toBe(
      'patient.drug.openfda.generic_name:"citalopram" OR ' +
        'patient.drug.openfda.substance_name:"citalopram" OR ' +
        'patient.drug.medicinalproduct:"citalopram"'
    );
    expect(q).not.toContain('+OR+');
  });

  it('names the union in matched_via so a caller knows it is not one field', () => {
    expect(EVENT_MATCHED_VIA).toContain('union');
    for (const field of EVENT_SEARCH_FIELDS) {
      expect(EVENT_MATCHED_VIA).toContain(field);
    }
  });

  it('escapes nothing but passes the term through verbatim', () => {
    expect(buildEventSearch('oxycodone')).toContain('"oxycodone"');
  });
});
