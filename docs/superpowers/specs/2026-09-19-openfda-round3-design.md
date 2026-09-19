# openFDA MCP server — round 3 design (1.2.0 → 1.3.0)

Date: 2026-09-19
Source: `BUGFIX_PROMPT.md` (round 3), written against published 1.2.0
Target version: **1.3.0** — new parameters and changed output shapes, all additive or clarifying

## Scope

All six findings: R1–R6. Nothing deferred.

## Verification of the brief against current `main`

Every finding was re-checked against `main` (`8d78d83`) and the live API.

| Item | Evidence |
|---|---|
| R1 | `serious` → `term=1`, **`typeof number`**; `patient.patientsex` → `2`; `reactionoutcome` → `6`; `reactionmeddrapt.exact` → `"DRUG INEFFECTIVE"` (string). `get-drug-adverse-event-counts.ts:24` declares `term: string` — the type is wrong, as the brief suspected |
| R2 | Neurontin at `limit: 5` → **71,393 chars** of results. Only **3** applications match, carrying 27/29/38 submissions; **one** application alone is 21,042 chars |
| R3 | `openfda.brand_name:"Advil"` → 39 total; `[0]` is the combination product, `[1]` is JUNIOR STRENGTH ADVIL (single-ingredient). `get-drug-by-name` has no `limit` or `skip` |
| R4 | insulin glargine: `openfda.route: ["SUBCUTANEOUS"]` vs `products[].route: ["INJECTION","INJECTION"]` |
| R5 | Rayos and Cordarone both resolve via `spl_product_data_elements` and report `generic_name: "Unknown"` |
| R6 | `'te_code' in product` → `[false, false]` on insulin glargine. `ask_doctor_or_pharmacist` appears in `get-drug-by-name` and `label-fields.ts`, never in `get-drug-safety-info` |

### Corrections to the brief

**1. R5's primary fix cannot work.** The brief says to backfill "from `openfda.generic_name` or `openfda.substance_name` on the same record". On both affected records the entire `openfda` object is empty — `Object.keys(result.openfda)` returns `[]`. There is nothing to backfill from.

**2. R5's fallback — parsing `spl_product_data_elements` — does not generalise.** The field is a space-joined blob. Extracting the lowercase run after the brand token gives:

```
Rayos      -> "prednisone"                     (correct)
Cordarone  -> "amiodarone hydrochloride"       (correct)
Glucophage -> "metformin hydrochloride metformin povidone magnesium
               stearate hypromelloses white to off-white"   (garbage)
```

It succeeds on the two examples in the brief only because their excipients happen to be uppercase. A third example breaks it.

A secondary lookup against the NDC directory was also tested and is worse: Rayos and Cordarone are `NOT_FOUND` there (discontinued), and `brand_name:"Advil"` returns a **topical analgesic** (camphor, capsaicin, menthol, methyl salicylate) — it would confidently return the wrong drug.

R5 therefore resolves to the brief's own final clause: stop emitting the literal `"Unknown"`.

**3. The brief's closing note is stale.** It states `serverInfo` "currently reports `1.0.0` regardless of the published version" and proposes exposing the real version as an npx-cache discriminator. That was fixed in 1.1.0: `serverInfo` reports **1.2.0**, injected from `package.json` at build time by vite, with `tests/version.test.ts` guarding against a literal returning. No work needed.

### Authoritative FAERS code meanings

openFDA publishes a machine-readable field reference at
`https://open.fda.gov/fields/drugevent.yaml`. Values used in this release are
taken from it verbatim, not inferred:

| Field | Values |
|---|---|
| `patient.patientsex` | `0` Unknown, `1` Male, `2` Female |
| `serious` | `1` "The adverse event resulted in death, a life threatening condition, hospitalization, disability, congenital anomaly, or other serious condition"; `2` "The adverse event did not result in any of the above" |
| `patient.reaction.reactionoutcome` | `1` Recovered/resolved … `6` Unknown — identical to the repo's existing `REACTION_OUTCOMES` |

## §1 — Decode aggregated terms (R1)

The defect is not merely that codes are raw; it is that **two tools decode the
same fields differently**. `get-drug-adverse-events` returns `"Yes"`/`"No"` and
`"Recovered/resolved"`, while `get-drug-adverse-event-counts` returns bare
integers. Adding a second decoder would leave two sources of truth.

`src/drug/faers.ts` becomes the single source:

- Add `SERIOUSNESS` and `PATIENT_SEX` maps beside the existing
  `REACTION_OUTCOMES`, with values from the YAML above.
- Add `describeCountTerm(field, term)` which decodes when the counted field is
  coded and passes text through unchanged.
- **Both** tools consume these maps.

Consequence, accepted deliberately: the per-record tool's `serious` output
changes from `"Yes"`/`"No"` to `"Serious"`/`"Not serious"`. Two tools
disagreeing is the defect being fixed; leaving the per-record tool alone would
preserve it.

Counts return `{ term, term_code, count }` — the decoded label, the raw code,
and the count — so callers aggregating by code are unaffected.

`interface CountTerm`'s `term` becomes `string | number` to match what openFDA
actually sends.

Text fields (`reactionmeddrapt.exact`, `occurcountry.exact`,
`generic_name.exact`) pass through untouched.

A manual `npm run probe:faers-codes` re-validates every map against the live
YAML, mirroring `probe:drugsfda` — the probe pattern is what caught the six
fabricated paths in round 2.

## §2 — Bound `get-drugsfda` output (R2)

`limit` bounds applications, not bytes, so it cannot solve this: a single
application with a long approval history exceeds the budget alone.

Add `detail: z.enum(['summary', 'full']).default('summary')`.

- **summary** (default): `application_number`, `sponsor_name`, `products`, and
  `submission_count` — the count, not the array.
- **full**: includes `submissions[]`, but capped per record at
  `MAX_SUBMISSIONS_PER_RECORD = 10` with the same "showing N of M" honesty the
  rest of the API uses, so no input can blow the budget entirely.

  10 is chosen from the measurement: one Neurontin application with 38
  submissions is 21,042 characters, so roughly 550 characters per submission.
  Ten submissions is about 5.5k per record, and at the default `limit` of 5
  that is roughly 28k — comfortably inside the budget that 71,393 exceeded.
  Each record reports `submission_count` (the true total) alongside the capped
  array, so truncation is always visible.

The `products[]` array is retained in summary mode: it is small and it carries
the fields most callers want.

## §3 — Paging for `get-drug-by-name` (R3)

Add `limit` (default 1, max 25) and `skip`, matching the sibling tools.

No ranking heuristic. Selection bias was considered and rejected: preferring
single-ingredient products would reorder unhelpfully for drugs that are
genuinely combinations, and `openfda.is_original_packager` is not populated on
every label. Instead:

- `substance_name` moves to the front of the emitted payload, so a combination
  product is immediately visible.
- The description states that the first label is not necessarily the canonical
  one and that `skip` reaches the others.

## §4 — Honest absence for `generic_name` (R5)

When neither `openfda.generic_name` nor `openfda.substance_name` is present,
`generic_name` becomes `null`, not the literal string `"Unknown"`.

`"Unknown"` reads like data — it is indistinguishable from a drug whose generic
name is genuinely recorded as unknown. `null` is unambiguous.

The always-present-key invariant still holds: the key is emitted, its value is
`null`. `resolveGenericName`'s return type becomes `string | null`.

No SPL parsing and no secondary lookup — both were tested and shown wrong above.
The tool descriptions state when `null` occurs.

## §5 — Consistency (R4, R6)

- **`te_code`** is always emitted on every entry of `get-drugsfda`'s
  `products[]`, `null` when absent, matching the present-but-empty invariant
  adopted in 1.1.0.

  This means `get-drugsfda` stops passing product records through verbatim and
  normalises each one. That is a deliberate narrowing: the tool already
  reshapes its output in summary mode (§2), so a single normalisation step
  covering both modes keeps one code path. Only `te_code` is added — no other
  product field is renamed, dropped or reordered, so existing consumers see the
  same keys plus one.

  `null` rather than `[]` because `te_code` is a scalar string upstream (e.g.
  `"AB"`), not an array; an empty array would misrepresent its type.
- **`ask_doctor_or_pharmacist`** is added to `get-drug-safety-info` so the two
  sibling tools expose the same OTC Drug Facts field set. It is already in
  `mapLabelFields`; `mapSafetyFields` gains it.
- **Route vocabularies** are documented in both `get-drugsfda`'s and the label
  tools' descriptions: `openfda.route` is the SPL route of administration,
  `products[].route` is the Drugs@FDA product route, and the two use different
  controlled vocabularies so joining on route across tools will silently miss.
  No normalisation is invented — mapping `SUBCUTANEOUS` to `INJECTION` would be
  a judgement call with no authoritative source.

## §6 — Testing

Offline, fixture-backed:

1. `field: "serious"` returns decoded labels and a `term_code` (R1)
2. `field: "patient.reaction.reactionmeddrapt.exact"` is unchanged (R1)
3. Both AE tools agree on the label for the same `serious` code (R1)
4. A `get-drugsfda` record with 38 submissions returns within budget in summary
   mode, and reports the submission count (R2)
5. `detail: 'full'` caps `submissions[]` and states how many were omitted (R2)
6. `get-drug-by-name` with `skip: 1` reaches a different label than the default (R3)
7. `generic_name` is `null`, never `"Unknown"`, when both sources are absent (R5)
8. Every product record exposes `te_code` (R6)
9. `get-drug-safety-info` and `get-drug-by-name` expose the same OTC field set (R6)
10. The description-drift guard still passes for every tool whose shape changed

Plus manual `npm run probe:faers-codes` against the live YAML. Not in CI.

## Out of scope

Exposing the package version in `serverInfo` — already done in 1.1.0.
Route normalisation — no authoritative mapping exists.
SPL-blob parsing for `generic_name` — demonstrated unreliable.
