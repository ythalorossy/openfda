# OpenFDA MCP Server

A Model Context Protocol (MCP) server for querying drug information from the OpenFDA API.

<a href="https://glama.ai/mcp/servers/@ythalorossy/openfda">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@ythalorossy/openfda/badge" alt="OpenFDA MCP server" />
</a>

## Features

2.0.0 registers one tool per openFDA drug endpoint, each with the same shape:
a `field` + `value` search, `limit`/`skip` for paging, `detail` for the
returned record shape, and (where the endpoint supports it) `sort` and
`count` for ordering and frequency aggregation. Adding an endpoint means
adding a row here, not rewriting the pattern.

- **`drug-label`** — Search FDA structured product labels (SPL): prescribing
  and OTC drug info. `field`: `drug_name` (brand/generic/substance, tiered),
  `ndc`, `spl_product_data_elements`, `effective_time`, `id`, `set_id`,
  `brand_name`, `generic_name`, `substance_name`, `manufacturer_name`,
  `route`, `product_type`, `application_number`, `unii`, `rxcui`. `detail`:
  `summary` (default; identity plus the safety narrative, every field
  present, empty if absent), `safety` (warnings, contraindications,
  interactions and overdosage — see the migration table below for the 1.x
  tool this replaces), `full` (the raw upstream record). `count`:
  `openfda.route.exact`,
  `openfda.product_type.exact`, `openfda.manufacturer_name.exact`. `sort`:
  `effective_time:desc`/`effective_time:asc`. `limit` default
  1, max 25.
- **`drug-event`** — Search FAERS adverse event reports (voluntarily
  submitted side-effect reports; not evidence of causation). `field`:
  `drug_name` (unions `patient.drug.openfda.generic_name`,
  `patient.drug.openfda.substance_name` and `patient.drug.medicinalproduct`),
  `brand_name`, `manufacturer_name`, `product_ndc`, `pharm_class`,
  `drug_characterization`, `indication`, `reaction`, `reaction_outcome`,
  `serious`, `seriousness_death`, `patient_sex`, `reporter_qualification`,
  `country`, `received_date`, `report_id`. `detail`: `summary` (default; one
  row per report, FAERS codes decoded, (reaction, outcome) pairs
  deduplicated), `full`. Also takes `seriousness`
  (`serious`/`non-serious`/`all`, default `all`). `sort`:
  `receivedate:desc`/`receivedate:asc`; without `sort`, results are a
  deterministic earliest-`report_id` slice. `count`:
  `patient.reaction.reactionmeddrapt.exact`,
  `patient.reaction.reactionoutcome`, `serious`, `patient.patientsex`,
  `occurcountry.exact`, `patient.drug.openfda.generic_name.exact` (see the
  migration table below for the 1.x tool this replaces). `limit` default 10,
  max 50.
  Note: the searchable `received_date` field maps to `receivedate`, but the
  `summary` projection's returned `report_date` reads `receiptdate` — two
  different, near-duplicate FAERS date fields. Filtering by one and reading
  the other back will not, in general, show the same date.
- **`drug-drugsfda`** — Search Drugs@FDA application data: approvals,
  sponsors, products and submissions. `field`: `products.brand_name`
  (default drug-name search, 98.79% populated), `application_number`,
  `sponsor_name` (stored uppercase upstream; normalised automatically),
  `products.active_ingredients.name`, `products.dosage_form`,
  `products.route`, `products.marketing_status`, `products.reference_drug`,
  `products.te_code`, `openfda.brand_name`, `openfda.generic_name`,
  `openfda.substance_name`, `openfda.manufacturer_name`, `openfda.route`,
  `openfda.product_ndc` (the `openfda.*` names are the openFDA-harmonised
  spelling of the same identifiers, but populated on only ~42% of
  applications — the precise alternative to `products.brand_name`, not the
  default), `submissions.submission_type`, `submissions.submission_status`,
  `submissions.submission_status_date`, `submissions.submission_class_code`,
  `submissions.review_priority`. `detail`: `summary` (default; application
  number, sponsor, `openfda` block and `products` — each product carries
  `te_code`, `null` when absent — plus a `submission_count`, with no
  `submissions` array), `full` (adds `submissions`, capped at 10 per record,
  plus `submissions_truncated` when more were omitted). `count`:
  `sponsor_name`, `products.marketing_status`, `products.dosage_form.exact`.
  `limit` default 5, max 100. Seven search paths openFDA publishes on this
  endpoint are deliberately not exposed here — see
  [Migrating from 1.x](#migrating-from-1x) below.
- **`drug-ndc`** — Search the NDC Directory: every drug product currently
  listed with the FDA (packaging, labeler, marketing category and
  application number). This is the **product registry**, distinct from
  `drug-label`'s `ndc` field, which searches *labelling text* by NDC — see
  the migration table below for the 1.x NDC lookup this tool is not a
  replacement for. `field`: `product_ndc`,
  `packaging.package_ndc`, `generic_name`, `brand_name`,
  `active_ingredients.name`, `openfda.manufacturer_name`,
  `marketing_category`, `application_number`, `dosage_form`, `route`,
  `product_type`, `pharm_class`, `marketing_start_date`, `openfda.unii`,
  `openfda.rxcui`, `openfda.spl_set_id`. `detail`: `summary` (default;
  identity, packaging and marketing status), `full` (raw upstream record).
  `count`: `dosage_form.exact`, `route.exact`, `product_type.exact`, `marketing_category`,
  `openfda.manufacturer_name.exact`. `limit` default 5, max 50.
- **`drug-enforcement`** — Search FDA drug recall and enforcement reports.
  `classification` is the hazard level (Class I: reasonable probability of
  serious harm or death; II: temporary or reversible harm; III: unlikely
  harm) and `status` says whether a recall is Ongoing, Completed or
  Terminated — a recall appearing in results does not mean it is still in
  effect. `field`: `product_description` (default drug-name search, 100%
  populated), `recall_number`, `event_id`, `code_info`, `recalling_firm`,
  `reason_for_recall`, `classification`, `status`, `voluntary_mandated`,
  `state`, `country`, `recall_initiation_date`, `report_date`,
  `termination_date`, `openfda.generic_name`, `openfda.brand_name`,
  `openfda.product_ndc` (the last three are exact but populated on only
  ~18% of recalls — the precise alternative to `product_description`, not
  the default). `detail`: `summary` (default; every field above except the
  three `openfda.*` names, which are bundled as one `openfda` object),
  `full` (raw upstream record). `count`: `classification.exact`, `status.exact`,
  `state.exact`, `voluntary_mandated.exact`, `recalling_firm.exact`. `sort`:
  `report_date:desc`/`report_date:asc`/`recall_initiation_date:desc`.
  `limit` default 5, max 50.
- **`drug-orangebook`** — Search the Orange Book: FDA-approved drug products
  with their therapeutic-equivalence ratings. Almost all data lives in the
  nested `products` array, which this tool flattens into one entry per
  product. `field`: `products.brand_name`, `products.active_ingredients.name`,
  `products.application_number`, `products.application_type`,
  `products.application_full_name`, `products.application_name`,
  `products.therapeutic_equivalence_codes`, `products.reference_listed_drug`,
  `products.reference_standard`, `products.dosage_form`, `products.route`,
  `approval_date`. `detail`: `summary` (default; `approval_date`,
  `product_number` and the flattened `products` array —
  `reference_listed_drug` and `reference_standard` are booleans always
  returned, `false` a fact rather than a missing value), `full` (raw
  upstream record). `count`: `products.application_type`,
  `products.dosage_form.exact`, `products.route.exact`,
  `products.therapeutic_equivalence_codes`. `sort`:
  `approval_date:desc`/`approval_date:asc`. `limit` default 5, max 50.
- **`drug-shortages`** — Search FDA drug shortage reports. `status` is one of
  three values, live-verified 2026-09-21: `Current` (1153 records),
  `To Be Discontinued` (443), or `Resolved` (7) — a product appearing here is
  not necessarily short now, and `To Be Discontinued` is neither "current"
  nor "resolved" but the larger of the two non-`Current` states. openFDA
  sends an empty
  string, not `null`, for an absent date on this endpoint; this tool
  normalises those to `null`. `field`: `generic_name` (default),
  `company_name`, `openfda.manufacturer_name`, `openfda.brand_name`,
  `openfda.substance_name`, `package_ndc`, `openfda.product_ndc`, `status`,
  `therapeutic_category`, `dosage_form`, `update_type`,
  `initial_posting_date`, `update_date`. `detail`: `summary` (default;
  the `openfda.*` names are bundled as one `openfda` object), `full` (raw
  upstream record). `count`: `status`, `dosage_form.exact`,
  `therapeutic_category`, `company_name.exact`. `sort`:
  `update_date:desc`/`update_date:asc`/`initial_posting_date:desc`. `limit`
  default 10, max 50. Smallest drug dataset (~1,600 records); a coverage
  percentage here represents far fewer records than the same percentage
  elsewhere.

Every tool's response envelope carries `matched_via` (which field path
actually matched), `total` (the upstream match count, not the number of
records in this response), `returned` (how many records it does carry),
`limit`, `dropped_for_budget` (how many rows were dropped to stay within the
60,000-character response budget — `0` when none were, never omitted),
`next_skip` (the offset to resume paging from; `null` when the result set is
exhausted or the next offset would exceed `SKIP_MAX`) and `results`.
**Page by `next_skip`, not `skip + limit`** — the budget can drop trailing
rows, so `skip + limit` silently steps over exactly the rows that were
dropped. A search that matches nothing returns a plain no-results message,
not an error.

`limit` means two different things depending on whether `count` is set: for
a record search it caps rows returned, capped at that tool's `max` below;
for an aggregation it caps buckets, defaulting to 100 (openFDA's own bucket
ceiling) when omitted. This is an asymmetry on every tool except
`drug-drugsfda` (whose record max is already 100): omitting `limit` under
`count` can return up to 100 buckets, but an explicit `limit` is still
rejected above the tool's record max — so a caller can *receive* more
buckets than it can *explicitly request*. Record maxes: `drug-label` 25,
`drug-event` 50, `drug-drugsfda` 100, `drug-ndc` 50, `drug-enforcement` 50,
`drug-orangebook` 50, `drug-shortages` 50.

An aggregated response is trimmed to the same 60,000-character budget as a
record response, and reports `dropped_for_budget` for the buckets it dropped
— `returned` counts the buckets actually kept. It carries no `next_skip`:
an aggregation has no result total and no skip semantics, so an offset to
resume from would be a number with nothing behind it.

> **Route vocabularies differ across tools.** `drug-label`'s `route` field
> (`openfda.route`, the SPL route of administration) and `drug-drugsfda`'s
> `products.route` field (the Drugs@FDA product route) are different
> controlled vocabularies. The same insulin glargine product is reported as
> `SUBCUTANEOUS` in one and `INJECTION` in the other, so joining or filtering
> on route across tools will silently miss matches.

1. **Set up your OpenFDA API Key**

   The server reads `OPENFDA_API_KEY` from its process environment. It is
   launched by your MCP client, so the key belongs in the `env` block of your
   client configuration (shown below) — **a `.env` file is not read.**

   Get a key from [OpenFDA API Key Registration](https://open.fda.gov/apis/authentication/).
   A key raises your limit from 40 to 240 requests per minute.

   Without a key, every tool call returns a configuration error rather than
   failing confusingly upstream. To run on the unauthenticated tier anyway,
   set `OPENFDA_ALLOW_KEYLESS=1` — note that tier reports no rate-limit
   headers, so exhausting it surfaces as slow, intermittent failures.

   > **Note:** Never commit your real API key to version control.

2. **Example MCP Server Configuration**

   If you are integrating this server with a larger MCP system, your configuration might look like:

   ```json
    {
      "mcpServers": {
          "openfda": {
              "command": "npx",
              "args": [
                  "-y",
                  "@ythalorossy/openfda"
              ],
              "env": {
                  "OPENFDA_API_KEY": "*****************************************"
              },
              "timeout": 60000,
              "autoApprove": [
                  "drug-label",
                  "drug-event",
                  "drug-drugsfda",
                  "drug-ndc",
                  "drug-enforcement",
                  "drug-orangebook",
                  "drug-shortages"
              ]
          }
      }
    }
   ```

   Replace the asterisks with your actual API key.

## Want to run it locally?

```bash
git clone https://github.com/ythalorossy/openfda.git
cd openfda
npm install
npm run build
```

Then start the server:

```bash
node dist/index.js
```

Or use it directly with npx:

```bash
npx @ythalorossy/openfda
```

## Configuration

Export `OPENFDA_API_KEY` in your shell before running locally: `export OPENFDA_API_KEY=your_key`.

<!-- migration-table -->
## Migrating from 1.x

2.0.0 replaces the nine `get-*` tools with one tool per openFDA drug endpoint.
Pin `1.3.0` if you are not ready to migrate.

| 1.x tool | 2.0.0 call |
| --- | --- |
| `get-drug-by-name` | `drug-label` `{ field: "drug_name", value }` |
| `get-drug-by-generic-name` | `drug-label` `{ field: "generic_name", value }` |
| `get-drugs-by-manufacturer` | `drug-label` `{ field: "manufacturer_name", value }` |
| `get-drug-safety-info` | `drug-label` `{ field: "drug_name", value, detail: "safety" }` |
| `get-drug-by-ndc` | `drug-label` `{ field: "ndc", value }` |
| `get-drug-by-product-ndc` | `drug-label` `{ field: "ndc", value }` |
| `get-drug-adverse-events` | `drug-event` `{ field: "drug_name", value }` |
| `get-drug-adverse-event-counts` | `drug-event` `{ value, count: "patient.reaction.reactionmeddrapt.exact" }` |
| `get-drugsfda` | `drug-drugsfda` `{ field: "application_number", value }` or `{ field: "products.brand_name", value }` |

**`drug-drugsfda` field names carry no section prefix.** 1.x grouped fields
under a `section` parameter (`application`, `products`, `submissions`,
`openfda`), so the table row above is illustrative, not literal: real field
names are flat where 1.x had a section for the top-level `application`
fields — `application_number` and `sponsor_name` carry no prefix — while
`products.*`, `submissions.*` and `openfda.*` keep theirs. A caller who
copies `application.sponsor_name` from 1.x muscle memory gets an
unknown-field error; the correct value is `sponsor_name`.

**`get-drug-by-ndc` did not search `/drug/ndc.json`.** It searched *labels*
by `openfda.product_ndc`, so it maps to `drug-label` (`{ field: "ndc" }`),
**not** to `drug-ndc`. `drug-ndc` searches the actual NDC Directory — new
capability this server did not previously expose — and returns different
data than the label-based lookup 1.x actually performed: use `drug-ndc` for
packaging, labeler and marketing-category questions, and `drug-label` for
label text keyed off an NDC.

**`get-drug-by-product-ndc` returned a pre-filtered `available_packages`**
— the label's package NDCs filtered down to the product you searched.
`drug-label`'s `summary` detail returns `package_ndc` **unfiltered**, so on
a label that covers several products it mixes packages from all of them.
Nothing is lost: `summary` also returns `product_ndc[]`, so filtering by
prefix is a one-line operation on the caller's side, and
`active_ingredient`, `purpose` and `dosage_and_administration` are reachable
via `detail: "full"` — but the convenience of a pre-filtered list is gone.

**Seven Drugs@FDA search paths available in 1.x are deliberately not
exposed** on `drug-drugsfda`: `openfda.application_number` (a 42%-populated
duplicate of the 100%-populated `application_number`), `products.product_number`
and `submissions.submission_number` (per-application ordinals that match
tens of thousands of unrelated records corpus-wide), and all four
`submissions.application_docs.{id,url,date,type}` (opaque per-document
values you must already possess in order to search by them). See
`docs/superpowers/notes/2026-09-20-field-selection.md` (`## drugsfda` →
"Deliberately not exposed") for the full reasoning. All seven remain
reachable through the field-catalog resource a later release publishes, so
nothing becomes unqueryable — they are simply no longer in the `field` enum.

Other behaviour changes:

- **Search-value injection is fixed.** Every 1.x tool interpolated the
  caller's search value straight into the query string. A crafted value
  could append a clause and make the server report data for a different
  drug than the one named in its own `matched_via` — verified live:
  `openfda.brand_name:"Advil"` returns 39 records, `openfda.brand_name:"Tylenol"`
  returns 111, and the injected combination of the two returns 150. 2.0.0
  escapes every value, and query assembly is confined to one file with a
  test enforcing it.
- A search that matches nothing now returns a plain no-results message.
  Previously openFDA's HTTP 404 was reported as `isError: true` with
  "Failed to retrieve…", which was indistinguishable from an outage.
- `'Unknown'` placeholder strings are gone. Absent values are `null` or `[]`,
  so a placeholder can no longer be mistaken for data.
- `get-drug-safety-info`'s scalar `drug_name` is now the array `brand_name`
  (on `drug-label`'s `detail: "safety"`).
- Response headers are uniform across tools; the emoji/prose headers are
  gone.
- Every response is capped at 60,000 characters, dropping trailing records
  and saying how many, rather than returning an unusable wall of text.

## License

MIT 

[Buy me a Coffee](https://buymeacoffee.com/ythalorossy)

![coff.ee/ythalorossy](https://raw.githubusercontent.com/ythalorossy/openfda/refs/heads/main/bmc_qr.png "Buy me a Coffee")
