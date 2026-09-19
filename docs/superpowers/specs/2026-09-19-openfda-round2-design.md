# openFDA MCP server — round 2 design (1.1.0 → 1.2.0)

Date: 2026-09-19
Source: `BUGFIX_PROMPT.md` (round 2), written against published 1.1.0
Target version: **1.2.0** — new tool and new optional parameters, all additive

## Scope

All six defects (N1–N6) and all five limitations (L1–L5). Nothing deferred.

## Verification of the brief against current `main`

Every finding was re-checked against `main` (`737aa30`) and the live API before
being accepted. All eleven reproduce. Measurements:

| Item | Evidence |
|---|---|
| N1 | `get-drugsfda.ts:47` hardcodes `.limit(1)`; `products.marketing_status:"Discontinued"` has **14,813** matches |
| N2 | `get-drugsfda.ts:16` — `sectionName` is a bare `z.string()` |
| N4 | citalopram: `medicinalproduct` **113,881**, `openfda.generic_name` **136,043**, `openfda.substance_name` **136,043** |
| N5 | `get-drug-by-ndc.ts:31` lists only 5-4 shapes; sibling at `get-drug-by-product-ndc.ts:30` has the full set |
| N6 | `get-drug-by-name` returns `boxed_warning` / `warnings_and_cautions`, advertises neither |
| L1–L5 | All reproduce; `generic_name: 'Unknown'` at `get-drug-safety-info.ts:39` |

### N3 is larger than the brief reports

The brief flags `application` as broken. An `_exists_` probe of all 25
advertised section/field pairs found **six** non-existent paths, not one:

```
BAD  application.application_number
BAD  application_docs.applications_doc_id
BAD  application_docs.applications_doc_date
BAD  application_docs.application_docs_title
BAD  application_docs.applications_doc_type
BAD  application_docs.applications_doc_url
```

The other 19 (`openfda.*`, `products.*`, `submissions.*`) all resolve.

`application_docs` is not merely mis-prefixed — **all five of its advertised
field names are fabricated**. The real shape is
`submissions.application_docs.{id, url, date, type}`, confirmed against live
data; `submissions.application_docs.type:"Label"` returns 5,088.

Also noted, not in the brief: `sponsor_name` is a real top-level searchable
field (29,335 records carry it) that the schema does not offer. It is added in
this release — see §1a.

### Capability probes behind the L1/L2 design

| Probe | Result |
|---|---|
| OR union of the three event fields (citalopram) | **143,346** — higher than either single field |
| `count=patient.reaction.reactionmeddrapt.exact` | works, returns `[{term, count}]` |
| `meta.results.total` on a count response | **absent (null)** |
| `skip=25000` / `skip=26000` | ok / `BAD_REQUEST: Skip value must 25000 or less` |
| `sort=receivedate:desc` and `:asc` | both work |

The OR union exceeding both single fields is what settles N4: a tiered
fallback would match on `medicinalproduct` first and never reach the better
index, so it would still under-report.

## §1 — `get-drugsfda` rebuilt (N1, N2, N3)

A `SECTIONS` lookup table replaces the prose field list in the description.
Each entry maps a section to its real query prefix and its verified fields:

- `openfda`, `products`, `submissions` — prefix equals the section name.
- `application` — **empty prefix**, so the query emits bare field names.
  Fields: `application_number` and `sponsor_name`, both top-level in a
  drugsfda result.
- `application_docs` — prefix `submissions.application_docs`, fields
  `id`, `url`, `date`, `type`.

Changes:

- `sectionName` becomes `z.enum` of the five sections.
- `fieldName` is validated against the chosen section's field list.
- An invalid section or field returns a distinct, actionable error naming the
  valid values. It must not resemble a no-results response — that
  indistinguishability is N2.
- Adds optional `limit` (default 5, maximum 100, enforced by the Zod schema)
  and threads `meta.results.total` through `summarizeResults`/`withTotals`,
  matching every other list tool.

## §1a — New capability: `sponsor_name` (added at the maintainer's request)

`sponsor_name` joins `application_number` in the empty-prefix `application`
section. Verified: `_exists_:sponsor_name` matches 29,335 records, and
`sponsor_name:"UPJOHN" AND application_number:"NDA020702"` returns 1.

**It is case-sensitive and stored uppercase.** Measured:

| Query | Result |
|---|---|
| `sponsor_name:"UPJOHN"` | 13 |
| `sponsor_name:"Upjohn"` | NOT_FOUND |
| `sponsor_name:"upjohn"` | NOT_FOUND |

A caller typing `Pfizer` would otherwise get a silent no-results that looks
identical to a genuine miss — the same indistinguishability N2 exists to fix.

So the handler **upper-cases the search value for `sponsor_name` only**, and
the field's description states that sponsor names are stored uppercase and the
input is normalized.

This normalization must NOT be applied index-wide: `openfda.brand_name:"Lipitor"`
is case-insensitive and matches fine, so the behaviour is field-specific and is
driven by a per-field flag in the `SECTIONS` table, not a blanket transform.

## §2 — Adverse-event search (N4)

New `src/drug/event-search.ts` builds one OR query across
`patient.drug.openfda.generic_name`, `patient.drug.openfda.substance_name` and
`patient.drug.medicinalproduct`, shared by both event tools.

Operators are space-separated (` OR `). A literal `+` would encode to `%2B`
and silently return NOT_FOUND — the trap from round 1.

Reports `matched_via` naming the union, so a caller knows the total is a union
of three indexes rather than one field.

## §3 — New tool: `get-drug-adverse-event-counts` (L1)

Separate tool rather than a `count` parameter on the existing one. A count
response contains no records and no `meta.results.total`, so it cannot honour
the `Showing N of M` contract the other list tools follow; one tool returning
two different shapes depending on a flag would be harder to consume than two
tools with one shape each.

Inputs: `drugName`, optional `field` (default
`patient.reaction.reactionmeddrapt.exact`), optional `limit` (default 10,
maximum 100). `field` is a `z.enum` of count-able fields verified against the
live API during implementation — not an open string, which would let a caller
send a non-aggregatable field and get an opaque upstream error.
Output: ranked `[{term, count}]`.

Its description states explicitly that a count response carries no result
total, so the absence is not mistaken for the P2-2 defect returning.

## §4 — Paging and ordering (L2)

`get-drug-adverse-events` gains optional `skip` and `sort`.

- `skip` is validated against the measured ceiling of 25,000 and rejected
  locally with a message saying so, rather than forwarding a request that
  returns `BAD_REQUEST`.
- `sort` is a `z.enum(['receivedate:desc', 'receivedate:asc'])` — only the
  two values verified to work. An open string would let callers send sort
  expressions that fail upstream with an opaque error.
- The description states that, unsorted, results are a deterministic
  earliest-`report_id` slice — so a small sample is not representative.

## §5 — Consistency (L3, L4, L5)

- **L3** `get-drug-by-name` reports a total, like every other tool since 1.1.0.
- **L4** `matched_via` extends to `get-drugs-by-manufacturer`,
  `get-drug-by-ndc` and `get-drugsfda`.
- **L5** `generic_name` resolves in this order, first non-empty wins:
  1. `openfda.generic_name[0]`
  2. `openfda.substance_name[0]`
  3. `'Unknown'`

  It does NOT attempt to parse a name out of `spl_product_data_elements` —
  that field is a free-text blob of product elements, and extracting an
  ingredient from it would be guesswork of exactly the kind this project has
  rejected elsewhere. If both openfda fields are absent, `'Unknown'` is the
  honest answer. The Cordarone case must be checked against live data during
  implementation to confirm `substance_name` is actually populated there; if
  it is not, L5 is reported as not-fixable rather than faked.

## §6 — Documentation and drift guard (N5, N6)

- One shared `NDC_FORMATS` constant renders the accepted-format block for both
  NDC tools, so their messages cannot drift apart again (N5).
- Descriptions updated to name every field actually returned, including
  `boxed_warning` and `warnings_and_cautions` on `get-drug-by-name` (N6).
- New test asserting each tool's described field names are a subset of the keys
  it returns. This is the guard that would have caught the fabricated
  `application_docs` names.

## §7 — Testing

Offline, fixture-backed, as in round 1:

1. `get-drugsfda` returns more than one record when more than one matches, and
   reports a total distinct from the returned count (N1)
2. An invalid `sectionName`, and a valid section with an invalid `fieldName`,
   each produce an error distinguishable from no-results (N2)
3. Every section in `SECTIONS` builds the query path that live probing proved
   real — in particular `application` with no prefix and `application_docs`
   under `submissions` (N3)
3a. `sponsor_name` is upper-cased before the query is built, and
   `openfda.brand_name` is NOT, proving the normalization is per-field (§1a)
4. The event OR query includes all three fields and encodes as `+OR+`, never
   `%2BOR%2B` (N4)
5. A citalopram total matches the recorded union figure (N4)
6. Both NDC tools' rejection messages render from the same constant (N5)
7. Each tool's described field names are a subset of its returned keys (N6)
8. The counts tool returns ranked terms and states it has no total (L1)
9. `skip` beyond 25,000 is rejected locally with no network call (L2)
10. `get-drug-by-name` reports a total (L3)
11. `generic_name` backfills rather than reporting `Unknown` (L5)

Plus a manually-run `_exists_` probe script that re-validates every advertised
section/field path against the live API — the check that found the six fake
paths. Not in CI.

## Out of scope

Nothing. All six defects, all five limitations, and the `sponsor_name`
capability are in this release.
