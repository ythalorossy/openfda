import { describe, it, expect } from 'vitest';
import { DRUG_ENDPOINTS } from '../src/datasets/drug/index';
import { toToolDefinition, ENVELOPE_FIELDS } from '../src/core/registry';
import { applyProjection } from '../src/core/shape/project';

/**
 * Both halves of the guard, for every endpoint and every projection:
 *   (a) the description NAMES each field the projection declares
 *   (b) the projection actually EMITS each field it declares
 *
 * Half (b) is the one that would have caught the fabricated get-drugsfda
 * field names: a tool can name a field in its description and in its
 * declaration and still never emit it.
 */
describe('descriptions do not drift from what tools return', () => {
  for (const descriptor of DRUG_ENDPOINTS) {
    const tool = toToolDefinition(descriptor);

    it(`${tool.name} names every envelope key it always returns`, () => {
      for (const key of ENVELOPE_FIELDS) expect(tool.description).toContain(key);
    });

    for (const projection of descriptor.projections) {
      it(`${tool.name} detail="${projection.name}" names every field it declares`, () => {
        for (const field of projection.returnsFields) {
          expect(
            tool.description,
            `${tool.name}/${projection.name} returns "${field}" but never names it`
          ).toContain(field);
        }
      });

      it(`${tool.name} detail="${projection.name}" actually emits every field it declares`, () => {
        // An empty record is the hardest case: a projection must still emit
        // every key, so "absent" is distinguishable from "never mapped".
        const [emitted] = applyProjection(projection, [{}]);
        for (const field of projection.returnsFields) {
          expect(
            Object.keys(emitted ?? {}),
            `${tool.name}/${projection.name} declares "${field}" but did not emit it`
          ).toContain(field);
        }
      });
    }
  }
});
