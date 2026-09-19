import { describe, it, expect } from 'vitest';
import {
  SECTIONS,
  SECTION_NAMES,
  resolveField,
} from '../src/drug/drugsfda-sections';

describe('SECTIONS', () => {
  it('offers exactly the five documented sections', () => {
    expect([...SECTION_NAMES].sort()).toEqual([
      'application',
      'application_docs',
      'openfda',
      'products',
      'submissions',
    ]);
  });

  it('emits application fields with NO prefix — they are top-level', () => {
    const r = resolveField('application', 'application_number');
    expect(r).toEqual({ ok: true, path: 'application_number', uppercase: false });
  });

  it('nests application_docs under submissions with its real field names', () => {
    const r = resolveField('application_docs', 'type');
    expect(r).toEqual({
      ok: true,
      path: 'submissions.application_docs.type',
      uppercase: false,
    });
  });

  it('never offers the six paths that do not exist upstream', () => {
    // These were advertised by 1.1.0 and match nothing.
    const fabricated = [
      'applications_doc_id',
      'applications_doc_date',
      'application_docs_title',
      'applications_doc_type',
      'applications_doc_url',
    ];
    for (const f of fabricated) {
      expect(resolveField('application_docs', f).ok).toBe(false);
    }
  });

  it('flags sponsor_name for uppercase normalisation, and nothing else', () => {
    expect(resolveField('application', 'sponsor_name')).toEqual({
      ok: true,
      path: 'sponsor_name',
      uppercase: true,
    });
    expect(resolveField('openfda', 'brand_name')).toEqual({
      ok: true,
      path: 'openfda.brand_name',
      uppercase: false,
    });
  });

  it('rejects an unknown section with a message naming the valid ones', () => {
    const r = resolveField('bogus', 'anything');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('bogus');
      for (const s of SECTION_NAMES) expect(r.message).toContain(s);
    }
  });

  it('rejects an unknown field with a message naming the valid fields', () => {
    const r = resolveField('products', 'not_a_field');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain('not_a_field');
      expect(r.message).toContain('marketing_status');
    }
  });

  it('prefixes openfda, products and submissions with the section name', () => {
    expect(resolveField('openfda', 'generic_name')).toMatchObject({
      path: 'openfda.generic_name',
    });
    expect(resolveField('products', 'marketing_status')).toMatchObject({
      path: 'products.marketing_status',
    });
    expect(resolveField('submissions', 'submission_status')).toMatchObject({
      path: 'submissions.submission_status',
    });
  });
});
