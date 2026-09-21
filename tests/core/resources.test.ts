import { describe, it, expect, vi } from 'vitest';
import { registerCatalogResources } from '../../src/core/resources';
import { DRUG_ENDPOINTS } from '../../src/datasets/drug/index';
import { DRUG_CATALOGS } from '../../src/datasets/drug/catalogs';

describe('field catalog resources', () => {
  it('registers one resource per endpoint at a stable uri', () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    const uris = registerResource.mock.calls.map((call) => call[1]);
    for (const descriptor of DRUG_ENDPOINTS) {
      expect(uris).toContain(`openfda://${descriptor.dataset}/${descriptor.endpoint}/fields`);
    }
    expect(uris).toHaveLength(DRUG_ENDPOINTS.length);
  });

  it('serves the full field list as JSON, far beyond the curated enum', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    const labelCall = registerResource.mock.calls.find((call) =>
      String(call[1]).includes('/label/')
    )!;
    const read = labelCall[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
    const result = await read(new URL('openfda://drug/label/fields'));
    const payload = JSON.parse(result.contents[0]!.text);

    const labelDescriptor = DRUG_ENDPOINTS.find((d) => d.endpoint === 'label')!;
    expect(payload.fields.length).toBeGreaterThan(labelDescriptor.fields.length * 5);
    expect(payload.fields[0]).toHaveProperty('path');
    expect(payload.fields[0]).toHaveProperty('description');
  });

  it('every endpoint resource returns substantially more fields than its curated enum', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    for (const descriptor of DRUG_ENDPOINTS) {
      const call = registerResource.mock.calls.find((c) =>
        String(c[1]).endsWith(`/${descriptor.endpoint}/fields`)
      )!;
      const read = call[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
      const result = await read(new URL(String(call[1])));
      const payload = JSON.parse(result.contents[0]!.text);
      expect(payload.fields.length).toBeGreaterThan(descriptor.fields.length);
    }
  });

  it('merges measured coverage onto every catalog field, including ones missing from the coverage file', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );

    for (const descriptor of DRUG_ENDPOINTS) {
      const call = registerResource.mock.calls.find((c) =>
        String(c[1]).endsWith(`/${descriptor.endpoint}/fields`)
      )!;
      const read = call[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
      const result = await read(new URL(String(call[1])));
      const payload = JSON.parse(result.contents[0]!.text);
      for (const field of payload.fields) {
        expect(field).toHaveProperty('coverage_pct');
      }
      // At least one field actually carries a measured, non-null percentage —
      // proving the merge pulled real data in, not just added the key as null
      // everywhere.
      expect(payload.fields.some((f: { coverage_pct: number | null }) => typeof f.coverage_pct === 'number')).toBe(true);
    }
  });

  it('never leaks an api_key into resource content', async () => {
    const registerResource = vi.fn();
    registerCatalogResources(
      { registerResource } as never,
      DRUG_ENDPOINTS,
      (descriptor) => DRUG_CATALOGS[descriptor.toolName]
    );
    for (const call of registerResource.mock.calls) {
      const read = call[3] as (uri: URL) => Promise<{ contents: { text: string }[] }>;
      const result = await read(new URL(String(call[1])));
      expect(result.contents[0]!.text).not.toContain('api_key');
    }
  });
});
