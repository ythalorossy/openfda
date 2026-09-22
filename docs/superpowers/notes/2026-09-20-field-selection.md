# Exposed-field selection for the 2.0.0 API-group tools

Date: 2026-09-20 · Task 3 of the `design/2.0.0-api-groups` plan

This note is the authoritative list of the fields each `drug-*` tool advertises in its
`field` enum. Tasks 15–17 and 21–24 copy from here. No code reads this file.

## Why curation, and what the numbers mean

The `field` enum is loaded into an agent's context the moment the server connects, whether
or not the tool is ever called, so every entry costs context permanently. The complete
FDA field list for each endpoint is served separately as a lazily-read MCP resource, so
anything left out here is still reachable on demand — it is simply not free.

A field is exposed only if it is:

1. **published in the catalog** — present in `src/catalog/drug-<endpoint>.json`, which is a
   verbatim copy of FDA's own field reference;
2. **a searchable scalar** — a string, date, number, boolean, or an array of those. Object
   containers (`openfda`, `patient`, `products`) are never exposed; their leaves may be.
   An array of strings *is* a searchable scalar in openFDA's query language — a match
   against any element matches the record — so `openfda.brand_name` (array) is fine;
3. **at or above 5% coverage** — measured in `src/catalog/drug-<endpoint>.coverage.json`;
4. **of genuine query utility** — an identifier, name, classification, status or date that
   someone would plausibly search *by*.

**Coverage is a veto, not a reason.** Clearing 5% earns a field nothing; criterion 4 has to
be met on its own merits. Several 100%-populated fields are rejected below for exactly this
reason. Conversely, a field that exists but is thinly populated is *worse* than an absent
one: it presents as a valid search that always returns nothing, which an agent cannot
distinguish from the data not existing. Where I accept a thin field anyway, I say why.

All `coverage_pct` values below are copied from the coverage catalogs
(label 262,883 records · event 20,692,690 · ndc 138,046 · enforcement 17,965 ·
drugsfda 29,335 · orangebook 48,761 · shortages 1,603).

### Three seeded fields do not exist in their catalog

The plan seeded these from real live-API records, but FDA's published reference does not
list them, so criterion 1 rejects all three. Each is recorded under its endpoint below:

| endpoint | seeded field | disposition |
| --- | --- | --- |
| ndc | `labeler_name` | absent from `drugndc.yaml`; substituted `openfda.manufacturer_name` |
| orangebook | `products.marketing_status` | absent from `drugorangebook.yaml`; it is a Drugs@FDA field, not an Orange Book one |
| shortages | `openfda.generic_name` | absent from `drugshortages.yaml`; substituted `openfda.substance_name` |

These are reported, not fixed — see "Catalog issues to report" at the end.

---

## label — `drug-label` · 207 catalog fields · 15 exposed

**The honest framing for this endpoint: the `openfda.*` fields are precise but partial.**
The entire `openfda` block is populated in only **33.09%** of SPL records, while
`spl_product_data_elements` sits at **99.89%** and `effective_time` at **100%**. Two thirds
of labels carry no structured `openfda` block at all. A `brand_name`-only search therefore
reaches roughly a third of the corpus and silently misses the rest. This is precisely why
the plan's `drug_name` convenience field is a four-tier fallback ending in
`spl_product_data_elements`, and why that field is exposed here in its own right rather
than being treated as an implementation detail of the resolver.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `spl_product_data_elements` | 99.89 | the only near-universal drug-name surface on this endpoint; the last-resort tier of the name resolver and the one search that reaches essentially the whole corpus |
| `effective_time` | 100 | the SPL version date; the only way to ask "labels revised since …", and a range filter over 100% of records |
| `id` | 100 | primary key of one specific label version; lets an agent re-fetch the exact record it was handed |
| `set_id` | 100 | the SPL identifier that is stable across label revisions; the join key from `drug-ndc` (`openfda.spl_set_id`) into this endpoint |
| `openfda.brand_name` | 33.09 | the proprietary name, and the first tier of the name resolver; precise when present |
| `openfda.generic_name` | 33.09 | the non-proprietary product name; second tier of the resolver |
| `openfda.substance_name` | 32.47 | the active moiety, listed per ingredient, so a combination product is findable by any one of its substances; third tier of the resolver |
| `openfda.manufacturer_name` | 33.09 | the labeler; the only company-name search this endpoint has |
| `openfda.product_ndc` | 33.09 | product-level NDC — the most precise drug key there is, and the cross-tool join to `drug-ndc` and `drug-shortages` |
| `openfda.package_ndc` | 33.09 | package-level NDC; what is actually printed on a carton, so it is what a caller holding a physical package has |
| `openfda.route` | 32.61 | route of administration (ORAL, TOPICAL, …); a small controlled vocabulary that usefully narrows a name search |
| `openfda.product_type` | 33.09 | OTC vs prescription; a two-value split that halves the corpus and is a common qualifier |
| `openfda.application_number` | 28.63 | NDA/ANDA/BLA number; the join key from `drug-drugsfda` and `drug-orangebook` back to the label |
| `openfda.unii` | 32.47 | FDA's unique ingredient identifier — unambiguous substance search where a name is ambiguous or spelled inconsistently |
| `openfda.rxcui` | 24.60 | RxNorm concept id; the identifier a clinical system will already be holding, so it makes this tool reachable from outside FDA's own naming |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- **The 49 narrative section fields that clear the floor** — `indications_and_usage` (96.46), `dosage_and_administration` (96.25), `warnings` (79.53), `inactive_ingredient` (63.59), `purpose` (62.58), `keep_out_of_reach_of_children` (62.32), `active_ingredient` (61.49), `spl_unclassified_section` (40.69), `stop_use` (36.82), `description` (36.24), `adverse_reactions` (34.95), `how_supplied` (34.63), `contraindications` (34.14), `clinical_pharmacology` (33.65), `overdosage` (32.08), `when_using` (31.13), and so on. These are free prose, not identifiers, names, classifications, statuses or dates, so criterion 4 rejects them. (The endpoint carries 85 narrative sections plus 86 `_table` variants of them; every `_table` variant measures 0%, 78 of the 85 are non-zero, and 49 clear 5% — those 49 are the ones this bullet rejects, since the rest never reached this list.) Exposing them would be the single largest drain on the schema budget on any endpoint. They remain fully searchable through the field resource, and they are still *returned* in results — this is a decision about what the enum advertises as a search key, not about what the tool shows.
- `version` (100) — a small integer with no meaning outside its own `set_id`; searching for "version 3" globally is meaningless.
- `openfda.spl_id` (33.09) and `openfda.spl_set_id` (33.09) — exact duplicates of `id` and `set_id`, which are the same values at 100% coverage. Exposing the 33% copies of a 100% field is strictly worse.
- `openfda.pharm_class_epc` (9.48), `openfda.nui` (10.06), `openfda.upc` (10.55), `openfda.pharm_class_cs` (5.45) — all clear the floor but only just. Pharmacologic-class search is genuinely useful, but at 9.48% it would miss more than nine labels in ten; that is the "looks valid, finds nothing" failure this curation exists to prevent. Class search belongs to `drug-ndc` (`pharm_class`, 53.81) and `drug-event` (`patient.drug.openfda.pharm_class_epc`, 67.03), where the data supports it.
- `openfda.is_original_packager` (24.85), `openfda.original_packager_product_ndc` (8.24) — repackager plumbing, not a query anyone starts from.
- `meta`, `meta.disclaimer`, `meta.last_updated`, `meta.license`, `meta.results`, `meta.results.limit`, `meta.results.skip`, `meta.results.total`, `meta.type` — **not record fields at all.** FDA's reference documents the response envelope alongside the record, so these 9 entries sit in the catalog and all measure 0%. They describe the wrapper openFDA puts *around* results and can never be searched. They are excluded by criteria 1–3 several times over; they are called out here so a future reader does not mistake them for a coverage bug.
- 102 of the 207 catalog fields measure 0% coverage, mostly `*_table` variants of the narrative sections (`warnings_table`, `dosage_and_administration_table`, …). They are real, published fields that are simply never populated in this corpus.

**Deviations from the plan's seeded list:** all 9 seeded fields kept. Added 6:
`effective_time`, `id`, `set_id`, `openfda.application_number`, `openfda.unii`,
`openfda.rxcui`. The first three are the endpoint's only 100%-populated structured fields
and give it a date filter and a stable key it otherwise lacked entirely; the last three are
cross-system identifiers (FDA application, UNII, RxNorm) that let an agent arrive at this
tool holding something other than a drug name.

---

## event — `drug-event` · 99 catalog fields · 18 exposed

The largest corpus by three orders of magnitude (20.7M reports) and the best-populated
`openfda` block of any endpoint at **88.78%** — the opposite of the label situation, because
FAERS reports are enriched by openFDA at ingest. The reported drug string
(`patient.drug.medicinalproduct`, 100%) and the normalised names are both worth having:
the former is verbatim what the reporter wrote, the latter is FDA's resolution of it.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `patient.drug.medicinalproduct` | 100 | the drug name exactly as the reporter wrote it; the only 100%-populated drug handle, and the one that catches reports openFDA could not normalise |
| `patient.drug.openfda.brand_name` | 88.78 | normalised proprietary name — the same query as `medicinalproduct` but spelling-robust |
| `patient.drug.openfda.generic_name` | 88.78 | normalised non-proprietary name; the usual entry point for "events for drug X" |
| `patient.drug.openfda.substance_name` | 85.71 | active moiety; reaches every product containing the substance, including combinations |
| `patient.drug.openfda.manufacturer_name` | 88.78 | "events involving products from firm X" — a standard pharmacovigilance cut |
| `patient.drug.openfda.product_ndc` | 88.78 | precise product key and the cross-tool join to `drug-ndc`, `drug-label` and `drug-enforcement` |
| `patient.drug.openfda.pharm_class_epc` | 67.03 | established pharmacologic class — the one field that supports class-level signal detection ("events across all SSRIs") rather than single-product search, and at 67% the data actually supports it |
| `patient.drug.drugcharacterization` | 100 | suspect / concomitant / interacting. Without this every result mixes the drug under suspicion with drugs the patient merely happened to be taking, which is the difference between a signal and noise |
| `patient.drug.drugindication` | 89.61 | what the drug was being given for; separates the indication from the adverse reaction |
| `patient.reaction.reactionmeddrapt` | 100 | the MedDRA preferred term for the reaction itself — the single most-searched field on this endpoint |
| `patient.reaction.reactionoutcome` | 79.83 | coded outcome (recovered, fatal, unknown, …); the severity axis at the reaction level |
| `serious` | 99.95 | the report-level serious / not-serious flag; the coarsest and most-used severity filter |
| `seriousnessdeath` | 37.91 | the fatal-outcome filter. Coverage is low *because presence is the signal*: the field is populated only on reports flagged for death, so 37.91% is the flagged population, not a data gap. It is the highest-stakes standard FAERS query and has no substitute |
| `patient.patientsex` | 87.85 | coded patient sex; a primary demographic stratification |
| `primarysource.qualification` | 96.38 | who reported it (physician, pharmacist, consumer, …) — the standard data-quality filter, since a clinician-sourced report carries different weight from a consumer one |
| `occurcountry` | 80.71 | where the event occurred; regional signal work and regulatory scope both start here |
| `receivedate` | 100 | the date FDA received the report; the only 100%-populated date and the basis of every trend-over-time query |
| `safetyreportid` | 100 | the report's own identifier; lets an agent re-fetch or cite one specific report |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- `receiptdate` (100), `transmissiondate` (100), `receiptdateformat` / `receivedateformat` / `transmissiondateformat` (99.23–100), `safetyreportversion` (85.46) — `receivedate` already covers the time axis; the rest are near-duplicate timestamps and format discriminators that describe the *encoding* of a date rather than the date.
- `primarysource.reportercountry` (98.19), `primarysourcecountry` (84.32) — better populated than `occurcountry` but semantically the reporter's country, not the event's. Exposing three country fields invites an agent to pick the wrong one; `occurcountry` is the one that answers "where did this happen".
- `seriousnesshospitalization` (46.76), `seriousnessother` (55.71), `seriousnesslifethreatening` (33.26), `seriousnessdisabling` (32.65), `seriousnesscongenitalanomali` (31.54) — the same shape as `seriousnessdeath` and equally valid, but five more enum entries for progressively narrower cuts. `serious` plus `seriousnessdeath` covers the coarse and the extreme; the middle categories are one resource lookup away.
- `fulfillexpeditecriteria` (100), `reporttype` (84.57), `duplicate` (58.38), `companynumb` (92.97), `reportduplicate.duplicatenumb` (58.34), `reportduplicate.duplicatesource` (60.24), `sender.senderorganization` (100), `sender.sendertype` (85.34), `receiver.receiverorganization` (85.46), `receiver.receivertype` (85.46), `authoritynumb` (5.22) — submission-pipeline bookkeeping. Real and well populated, but they describe how the report reached FDA, not the drug, the patient or the event.
- `patient.patientonsetage` (56.62), `patient.patientonsetageunit` (56.56), `patient.patientweight` (19.86) — numeric and meaningless without their companion unit field, which a single `field`+`value` pair cannot express. A caller searching `patientonsetage:45` gets years, months or decades depending on the record.
- `patient.patientagegroup` (18.43) — the coded age band would be the right way to do the above, but at 18.43% it misses four records in five.
- `patient.drug.drugadministrationroute` (81.36), `patient.drug.openfda.route` (85.77) — route is a poor discriminator on adverse-event reports and duplicated across two encodings.
- `patient.drug.drugstartdate` (53.25), `patient.drug.drugenddate` (27.35), `patient.drug.drugdosagetext` (68.49), `patient.drug.drugdosageform` (61.59), `patient.drug.drugstructuredosagenumb` (50.81), `patient.drug.drugbatchnumb` (36.39), and the other dosing fields — per-report therapy detail you read off a result, not a key you search a 20M-record corpus by.
- `patient.drug.openfda.application_number` (88.68), `patient.drug.openfda.spl_id` (88.78), `patient.drug.openfda.spl_set_id` (88.78), `patient.drug.openfda.unii` (85.70), `patient.drug.openfda.rxcui` (87.12), `patient.drug.openfda.package_ndc` (88.78) — well populated join keys, but `product_ndc` already provides the cross-tool join and the enum is at 18. These are the first candidates if a later task finds an event→Drugs@FDA chain is needed.
- `patient.summary.narrativeincludeclinical` (37.11), `patient.drug.drugadditional` (45.89) — free prose.

**Deviations from the plan's seeded list:** all 9 seeded fields kept. Added 9:
`patient.drug.openfda.brand_name`, `patient.drug.openfda.manufacturer_name`,
`patient.drug.openfda.product_ndc`, `patient.drug.openfda.pharm_class_epc`,
`patient.drug.drugcharacterization`, `patient.drug.drugindication`, `seriousnessdeath`,
`primarysource.qualification`, `safetyreportid`. The seeded list had no way to distinguish
a suspect drug from a concomitant one (`drugcharacterization`), no brand-name search at all,
no fatal-outcome filter, and no report identifier. `pharm_class_epc` is the only field on
any endpoint that makes class-level rather than product-level search viable.

---

## ndc — `drug-ndc` · 39 catalog fields · 16 exposed

The product registry: one record per marketed NDC. Nearly everything is well populated, so
selection here is almost entirely criterion 4 rather than coverage.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `product_ndc` | 100 | the endpoint's primary key and the join target for every other tool's `openfda.product_ndc` |
| `packaging.package_ndc` | 99.72 | the package-level NDC printed on the carton; a caller holding a physical box has this, not the product NDC |
| `generic_name` | 100 | the non-proprietary product name; 100% populated, unlike the label endpoint's equivalent |
| `brand_name` | 84.24 | the proprietary name; absent on the ~16% of listings marketed without one |
| `active_ingredients.name` | 98.19 | the individual active ingredient. Distinct from `generic_name`, which for a combination product is the whole compound string — this is the only way to find every product containing one ingredient |
| `openfda.manufacturer_name` | 81.24 | the company-name search, standing in for the seeded `labeler_name` (see below) |
| `marketing_category` | 100 | NDA / ANDA / OTC monograph / unapproved — the regulatory pathway, and the sharpest way to separate approved from unapproved products |
| `application_number` | 72.41 | NDA/ANDA number; the join key to `drug-drugsfda` and `drug-orangebook` |
| `dosage_form` | 100 | TABLET, INJECTION, …; a controlled vocabulary that is the natural second axis after a drug name |
| `route` | 82.89 | route of administration; same role, orthogonal axis |
| `product_type` | 100 | OTC vs prescription vs other; a coarse split of the whole registry |
| `pharm_class` | 53.81 | pharmacologic class. The best-populated class field outside `drug-event`, and the one that makes "all products in class X" answerable here |
| `marketing_start_date` | 100 | when the labeler began marketing; the endpoint's only universal date and the basis of "products launched since …" |
| `openfda.unii` | 79.82 | unique ingredient identifier. This endpoint has no `substance_name` field at all, so UNII is its only unambiguous substance key |
| `openfda.rxcui` | 60.87 | RxNorm concept id; the handle a prescribing or dispensing system already holds |
| `openfda.spl_set_id` | 81.24 | the stable SPL set id — the join key into `drug-label`, whose `set_id` is 100% populated. The concrete chain: find a product here, read its label there |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- `spl_id` (100) and `product_id` (100) — `spl_id` is the *versioned* document id, so it goes stale as soon as the labeler revises the SPL; `openfda.spl_set_id` is the stable form and is the one exposed. `product_id` is just `product_ndc` concatenated with `spl_id`.
- `brand_name_base` (84.24), `brand_name_suffix` (6.21) — decompositions of `brand_name`. Searching the base form is occasionally sharper, but not enough to spend two enum slots on a field already exposed.
- `finished` (100) — per FDA's own note, every record in this file is a finished product, so the field never discriminates.
- `listing_expiration_date` (97.19), `packaging.marketing_start_date` (83.97), `packaging.sample` (83.97), `packaging.description` (99.72) — listing administrivia and free-text pack descriptions.
- `openfda.pharm_class_epc` (23.61), `openfda.pharm_class_cs` (12.68), `openfda.pharm_class_moa` (11.47), `openfda.pharm_class_pe` (10.30), `openfda.nui` (25.16) — the decomposed class taxonomy. `pharm_class` at 53.81 is the union of these and is exposed in their place; the individual axes would be four thin duplicates.
- `openfda.upc` (27.80), `openfda.is_original_packager` (63.79) — retail barcode and repackager flag; neither is a search anyone starts from.
- **Below the floor, and worth naming:** `dea_schedule` (4.58) would be a genuinely valuable filter — controlled-substance schedule is exactly the kind of classification this curation is looking for — but at 4.58% it fails the coverage veto. Reachable through the field resource.

**Deviations from the plan's seeded list:** `labeler_name` **dropped** — it is not in
`drugndc.yaml` and therefore fails criterion 1, even though the plan read it from a live
record (see "Catalog issues to report"). `openfda.manufacturer_name` (81.24) is exposed in
its place and answers the same "which company" question. The other 9 seeded fields kept.
Added 7: `active_ingredients.name`, `packaging.package_ndc`, `openfda.manufacturer_name`,
`openfda.unii`, `openfda.rxcui`, `openfda.spl_set_id`, `marketing_start_date` — a package
NDC search, an ingredient-level search, a date axis, and the three identifiers that let
this tool be reached from, and chained into, the others.

---

## enforcement — `drug-enforcement` · 56 catalog fields · 17 exposed

Recall records. Almost every record-level field is 100% populated, so this endpoint is the
cleanest of the seven — with one sharp exception: the `openfda` enrichment block reaches only
**18.25%** of recalls, which shapes the drug-name guidance below.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `recall_number` | 100 | the recall's own identifier; the way to look up one specific recall |
| `event_id` | 100 | FDA's identifier for the recall *event*, which may span many recall records. Given one hit, this is how an agent finds its siblings — the single most useful follow-up query on this endpoint |
| `product_description` | 100 | the recalled product in free text. On this endpoint it is the primary drug-name search, not a fallback — see the note below |
| `code_info` | 100 | the lot, serial and expiry codes printed on the product. "Is my lot affected?" is the most common real question asked of recall data, and this is the only field that can answer it |
| `recalling_firm` | 100 | the company conducting the recall; the standard company-level cut |
| `reason_for_recall` | 100 | why it was recalled (contamination, superpotency, mislabelling, …). Free text, but it is the field that makes "all recalls caused by X" answerable, and it is the classification axis the data actually carries |
| `classification` | 100 | Class I / II / III — FDA's own severity grading, and the first filter any serious recall query applies |
| `status` | 100 | ongoing / completed / terminated; separates live risk from history |
| `voluntary_mandated` | 100 | firm-initiated vs FDA-mandated; a small but meaningful regulatory distinction |
| `state` | 100 | the recalling firm's state |
| `country` | 100 | the recalling firm's country; the coarse domestic/import split |
| `recall_initiation_date` | 100 | when the firm began the recall — the date that reflects when the risk started |
| `report_date` | 100 | when FDA published it — the date that reflects when the public learned |
| `termination_date` | 82.42 | when the recall closed. Absent on recalls still open, so its absence is itself informative, and it is the only way to bound "recalls closed in period X" |
| `openfda.generic_name` | 18.25 | the normalised non-proprietary name. Thin, and **not the default** — see the guidance below — but it is exact where `product_description` is tokenized prose, so it is the option a caller takes when precision matters more than recall |
| `openfda.brand_name` | 18.25 | the normalised proprietary name, on the same terms |
| `openfda.product_ndc` | 18.25 | the product NDC. Thin, but it is the **only** NDC on this endpoint, and without it `drug-enforcement` is the one tool of the seven that no other tool can hand a product key to. Every other endpoint exposes `product_ndc` or its `openfda` equivalent; omitting it here would break the chain in one direction only |

**Guidance on drug-name search here — `product_description` is the default, the `openfda` names are the precise option.**
Only **18.25%** of recalls carry an `openfda` block at all, while `product_description` is at **100%** and
contains the same drug name as tokenized text. A caller who reaches for `openfda.generic_name` first will
look authoritative and silently miss four recalls in five, and unlike `label` there is no fallback resolver
here to catch the miss — so the descriptor must steer the default to `product_description`. The two are
complementary rather than substitutes, which is the same reasoning that exposes both
`shortages.company_name` (100) and `shortages.openfda.manufacturer_name` (89.58) on that endpoint
(cross-endpoint citation — those two coverage figures are from `drug-shortages`, not this one): the loose field has the recall, the structured field
has the precision and matches only where the drug *is* the recalled product rather than merely mentioned.
And `openfda.product_ndc` carries a second justification that outweighs its coverage on its own —
cross-tool joinability, which every other endpoint in this note treats as first-class.

**Deliberately not exposed** (cleared 5%, rejected anyway):

- **`product_type` (100) — seeded by the plan, but rejected.** FDA's own field description says it plainly: "For drug queries, this will always be `Drugs`." Every record on this endpoint carries the identical value, so the field can never narrow a result set. Exposing it costs an enum slot and invites an agent to spend a turn on a no-op filter.
- **The rest of the `openfda.*` block** — `openfda.manufacturer_name` (18.25), `openfda.substance_name` (17.84), `openfda.package_ndc` (18.25), `openfda.route` (17.95), `openfda.application_number` (17.90), `openfda.unii` (17.86), `openfda.rxcui` (17.50), `openfda.product_type` (18.25), `openfda.spl_id` (18.25), `openfda.spl_set_id` (18.25), `openfda.is_original_packager` (17.20), `openfda.upc` (8.74), `openfda.nui` (6.43). Three members of this block are exposed (`generic_name`, `brand_name`, `product_ndc`); these are the rest, and they are redundant against fields already exposed at 100% — `recalling_firm` covers the company question that `openfda.manufacturer_name` would answer, and the remaining identifiers are reachable once a hit's `product_ndc` is in hand.
- `center_classification_date` (99.99) — a third near-identical date alongside `recall_initiation_date` and `report_date`.
- `city` (100), `address_1` (100), `address_2` (100) — firm address. `state` and `country` already give the geographic cut at a useful granularity; street addresses are high-cardinality and not something anyone searches by.
- `distribution_pattern` (100) — free text describing where the product went ("nationwide", "AL, FL and GA"), too unstructured to search reliably.
- `initial_firm_notification` (100) — how the firm notified customers (letter, press release, e-mail). A real classification, but no one filters recalls by notification medium.
- `product_quantity` (100), `more_code_info` (46.51) — a free-text quantity string and an overflow field for `code_info`.
- `meta`, `meta.disclaimer`, `meta.last_updated`, `meta.license`, `meta.results`, `meta.results.limit`, `meta.results.skip`, `meta.results.total`, `meta.type` — **not record fields.** As on `label`, FDA's reference documents the response envelope alongside the record, so these 9 entries are in the catalog at 0% coverage. They describe the wrapper around results and can never be searched. Noted here so the 0%s are not mistaken for a measurement failure.

**Deviations from the plan's seeded list:** 11 of the 12 seeded fields kept; `product_type`
**dropped** as a constant (see above). Added 6: `event_id`, `code_info`, `termination_date`
— recall-sibling lookup, lot-number lookup and a closing date — plus `openfda.generic_name`,
`openfda.brand_name` and `openfda.product_ndc` as the precise, non-default complement to
`product_description`, and because `openfda.product_ndc` is the only NDC this endpoint has to
receive a cross-tool join on.

---

## drugsfda — `drug-drugsfda` · 49 catalog fields · 20 exposed

The plan seeds this endpoint with all 25 paths from `src/drug/drugsfda-sections.ts`, every
one live-probed in 1.2.0. Live-probed means *exists*, not *worth advertising*: seven of the
25 are duplicates, ordinals or opaque per-document values that nobody searches a
29,335-record corpus by. Those 7 are dropped and 2 much better-populated product fields
added, landing at 20 exposed (25 seeded − 7 dropped = 18 kept, + 2 added = 20).

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `application_number` | 100 | the NDA/ANDA/BLA number — this endpoint's primary key, and the join target for `drug-label`, `drug-ndc` and `drug-orangebook` |
| `sponsor_name` | 100 | the application holder. Stored uppercase and case-sensitive upstream, so it must be normalised before querying or "Pfizer" silently returns nothing — a defect fixed in 1.2.0 and one the 2.0 descriptor must carry forward |
| `products.brand_name` | 98.79 | the proprietary name at **98.79%**, against `openfda.brand_name` at 42.31. The high-recall brand search on this endpoint, and the reason it is added |
| `products.active_ingredients.name` | 98.79 | the active ingredient at 98.79%, against `openfda.substance_name` at 41.11. The high-recall ingredient search |
| `products.dosage_form` | 98.79 | dosage form; a controlled vocabulary at near-full coverage |
| `products.route` | 98.26 | route of administration |
| `products.marketing_status` | 98.79 | prescription / OTC / discontinued — the field that separates products still on the market from withdrawn ones, which is the question most Drugs@FDA lookups are really asking |
| `products.reference_drug` | 98.79 | whether the product is a reference drug for generics; the ANDA-pathway anchor |
| `products.te_code` | 45.98 | therapeutic-equivalence code (AB, AB1, BX, …) — generic substitutability. Populated only for multi-source products, so 45.98% is close to the whole population for which the concept applies |
| `openfda.brand_name` | 42.31 | the normalised brand name. Kept alongside `products.brand_name` because it is the openFDA-harmonised spelling, which is what a caller arriving from another tool's result will be holding |
| `openfda.generic_name` | 42.31 | normalised non-proprietary name; this endpoint has no high-coverage equivalent, since `products.*` carries the ingredient rather than the generic product name |
| `openfda.substance_name` | 41.11 | normalised active moiety |
| `openfda.manufacturer_name` | 42.31 | the marketed-product manufacturer, which is often not the same firm as `sponsor_name` after a licence transfer — both are worth having |
| `openfda.route` | 41.29 | normalised route; the harmonised counterpart of `products.route` |
| `openfda.product_ndc` | 42.31 | the NDC of a marketed product under the application; the join into `drug-ndc` |
| `submissions.submission_type` | 90.77 | ORIG vs SUPPL — original application or supplement. The first thing you filter submissions by |
| `submissions.submission_status` | 90.77 | AP / TA / etc.; whether the submission was approved |
| `submissions.submission_status_date` | 90.77 | when it reached that status — the approval-date axis of this endpoint, and the field behind "what was approved in year X" |
| `submissions.submission_class_code` | 83.27 | the kind of change a supplement made (labeling, efficacy, manufacturing, …); the structured way to find, say, all labeling supplements |
| `submissions.review_priority` | 67.99 | priority vs standard review. Populated on the subset where the distinction was recorded, and it is a standard regulatory cut |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- **`openfda.application_number` (42.31) — seeded, dropped.** It is the same value as the top-level `application_number`, which is 100% populated. Exposing a 42% copy of a 100% field gives an agent two ways to ask one question and a 58% chance of picking the worse one.
- **`products.product_number` (98.79) — seeded, dropped.** An ordinal within an application ("001", "002"), reused across all 29,335 applications. Searching for product number 001 globally returns tens of thousands of unrelated records; it is only meaningful once you already have the application, at which point it is in the result.
- **`submissions.submission_number` (90.77) — seeded, dropped.** Same objection: a per-application counter, not a corpus-wide key.
- **`submissions.application_docs.id` (33.99), `submissions.application_docs.url` (33.99), `submissions.application_docs.date` (33.99) and `submissions.application_docs.type` (33.99) — all four seeded, all four dropped.** Nested two levels below `submissions` and populated on a third of applications. The `id` and `url` fields are opaque per-document values — an agent would have to already possess the exact URL to search by it, at which point it has the document. `date` and `type` are marginally more plausible ("applications with an approval letter") but return near-everything and cost two more enum slots. These four were fabricated in 1.1.0 and corrected in 1.2.0, so the *names* here are hard-won and correct; the judgment is that correct names still are not useful search keys. All four remain in the field resource.
- `submissions.submission_class_code_description` (65.54) — the prose expansion of `submission_class_code`. The code is exposed; the description is what you read in the result.
- `products.reference_standard` (96.20) — the bioequivalence reference standard flag. Closely related to `products.reference_drug`, which is exposed, and the distinction is too fine to spend a second slot on here. It *is* exposed on `drug-orangebook`, where reference-standard status is a first-class concept.
- `products.active_ingredients.strength` (98.76) — strength strings ("10MG", "5MG/ML") are meaningless as a standalone search; they only narrow a query that already names an ingredient, which a single `field`+`value` pair cannot express.
- `openfda.spl_id` / `openfda.spl_set_id` (42.31), `openfda.unii` (41.14), `openfda.rxcui` (41.30), `openfda.package_ndc` (42.31) — join keys already covered by `application_number` (100) and `openfda.product_ndc`.

**Deviations from the plan's seeded list:** 18 of the 25 seeded paths kept. Dropped 7
(`openfda.application_number`, `products.product_number`, `submissions.submission_number`,
and all four `submissions.application_docs.*`) for the reasons above. Added 2
(`products.brand_name`, `products.active_ingredients.name`) because the seeded list routed
every brand and substance search through the `openfda` block at ~42% coverage while
equivalent `products.*` fields sit at 98.79% — the same "precise but partial" trap as on
`label`, and here there is a well-populated alternative sitting right next to it. This is a
net reduction of 5 paths against what 1.x advertises; all 7 dropped paths remain reachable
through the field resource, so nothing becomes unqueryable.

---

## orangebook — `drug-orangebook` · 31 catalog fields · 12 exposed

Approved products with therapeutic-equivalence evaluations. Structurally the simplest
endpoint: the `products.*` block is 100% populated across the board, and the only fields
that fall away are patents and exclusivity.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `products.brand_name` | 100 | the proprietary name, fully populated |
| `products.active_ingredients.name` | 100 | the active ingredient; the generic-side entry point, since many Orange Book entries have no meaningful brand |
| `products.application_number` | 100 | the NDA/ANDA number; the join key to `drug-drugsfda` and `drug-ndc` |
| `products.application_type` | 100 | N (NDA) vs A (ANDA) — innovator versus generic, the fundamental split in this dataset |
| `products.application_full_name` | 100 | the full legal name of the firm holding the application |
| `products.application_name` | 100 | the applicant's short name. A genuinely different string from `application_full_name` ("MYLAN" vs "MYLAN PHARMACEUTICALS INC"), both 100% populated; a caller holding one form should not silently miss because only the other is searchable |
| `products.therapeutic_equivalence_codes` | 44.98 | the TE code (AB, AB1, BX, …). This is the *reason the Orange Book exists* — whether a generic is substitutable for the brand. Populated for 44.98%, which is close to the full population of multi-source products for which a TE rating is defined; single-source innovator products have nothing to be equivalent to |
| `products.reference_listed_drug` | 100 | whether the product is the RLD that generics must match. The other core Orange Book concept, and the anchor of every ANDA |
| `products.reference_standard` | 100 | whether the product is the bioequivalence reference standard. Distinct from the RLD and a first-class concept here, unlike on `drugsfda` |
| `products.dosage_form` | 100 | dosage form |
| `products.route` | 100 | route of administration |
| `approval_date` | 87.96 | when the product was approved; the endpoint's only date axis. The missing 12% are products approved before 1982, which the dataset flags rather than dates |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- `product_number` (100) — an ordinal within an application, one per strength. Corpus-wide it is meaningless, for the same reason as `products.product_number` on `drugsfda`.
- `products.active_ingredients.strength` (100) — strength strings only narrow a query that already names an ingredient; a single `field`+`value` pair cannot express the pair.
- `approved_prior_to_1982` (12.04, boolean) — the flag that explains the 12% gap in `approval_date`. Useful context in a result, but "show me pre-1982 approvals" is a narrow enough query to leave to the field resource.
- `patents.patent_number` (5.46), `patents.expiration_date` (5.46), `patents.patent_submission_date` (5.21) — patent search on the Orange Book is a real and valuable legal use case, and these are the fields that would serve it. They clear the 5% floor by a whisker and no more: 94.5% of products carry no patent block at all, so a patent search would look authoritative and come back empty for nineteen products in twenty. Rejected under the "thinly populated is worse than absent" rule, and called out here because this is the one rejection on this endpoint that costs something real. Available through the field resource for a caller who knows the shape of the data.
- `patents.drug_product_flag` (4.83), `patents.drug_substance_flag` (2.54), `patents.patent_use_code` (4.34), `patents.patent_delist_flag` (0.07), `exclusivity.*` (0–2.50) — below the floor outright.
- `products.product_type` (0), `patents.patent_use_code_definition` (0), `exclusivity.exclusivity_code_definition` (0) — published in FDA's reference but never populated in this corpus.

**Deviations from the plan's seeded list:** `products.marketing_status` **dropped** — it is
not in `drugorangebook.yaml` and fails criterion 1. It is a Drugs@FDA field, and it is
exposed there; the nearest Orange Book equivalents are `products.application_type` and
`products.reference_listed_drug`, both of which are exposed. The other 8 seeded fields
kept. Added 4: `products.therapeutic_equivalence_codes`, `products.reference_listed_drug`,
`products.reference_standard`, `products.application_name`. The first three are the
substance of the Orange Book and their absence from the seeded list would have left the
dataset's whole purpose unsearchable.

---

## shortages — `drug-shortages` · 41 catalog fields · 13 exposed

The smallest corpus (1,603 records) and the best-behaved `openfda` block outside `event`
at **89.58%**. Records are per-presentation, not per-product, so several shortage rows can
describe one drug at different pack sizes.

| path | coverage_pct | why exposed |
| --- | --- | --- |
| `generic_name` | 100 | the drug name as the shortage record states it; fully populated and the natural entry point |
| `company_name` | 100 | the firm reporting the shortage |
| `openfda.manufacturer_name` | 89.58 | the normalised labeler. Not the same as `company_name` — that is who reported, this is who labels — so both earn a slot |
| `openfda.brand_name` | 89.58 | the proprietary name, which the top-level fields do not carry at all |
| `openfda.substance_name` | 88.96 | the active moiety; the structured substance search, standing in for the seeded `openfda.generic_name` (see below) |
| `package_ndc` | 100 | the package NDC of the affected presentation; the precise "is this exact pack short?" lookup |
| `openfda.product_ndc` | 89.58 | the product-level NDC, which matches a drug across all its pack sizes where `package_ndc` matches only one; also the join into `drug-ndc` and `drug-label` |
| `status` | 100 | Current, To Be Discontinued or Resolved (corrected 2.0.1). The single most important field here — a resolved shortage is history, a current one is an operational problem |
| `therapeutic_category` | 100 | the clinical category of the drug; supports "what is short in oncology" without naming a drug |
| `dosage_form` | 98.81 | dosage form; injectables dominate shortages, so this is a meaningful cut |
| `update_type` | 100 | what kind of change the record represents |
| `initial_posting_date` | 100 | when the shortage was first reported — when the problem started |
| `update_date` | 100 | when the record was last changed. "What has moved this week" is the standard operational query against shortage data, and `initial_posting_date` cannot answer it |

**Deliberately not exposed** (cleared 5%, rejected anyway):

- `presentation` (100) — free text combining drug name, form, strength and NDC into one string. Every component of it is already exposed as a structured field.
- `contact_info` (100) — the firm's contact details; output, never a search key.
- `availability` (71.93), `related_info` (68.81) — free prose describing supply status and links.
- `shortage_reason` (25.58) — the cause (manufacturing delay, demand increase, discontinuation). This would be a genuinely interesting classification and it is the rejection I am least comfortable with, but at 25.58% three records in four carry no reason, so the filter would misrepresent the data more often than it informed. Available through the field resource.
- `discontinued_date` (27.64) — only meaningful for the discontinued subset, which `status` already isolates.
- `openfda.route` (89.02), `openfda.product_type` (89.58), `openfda.spl_id` / `openfda.spl_set_id` (89.58), `openfda.package_ndc` (89.58), `openfda.unii` (89.15), `openfda.rxcui` (87.27) — all well populated, but redundant against fields already exposed: `openfda.package_ndc` duplicates the 100% top-level `package_ndc`, and on a 1,603-record corpus the marginal value of a seventh way to name the same drug is close to zero. This is the one endpoint small enough that browsing beats filtering.
- `openfda.pharm_class_epc` (22.52), `openfda.nui` (22.58), `openfda.pharm_class_cs` (10.29), `openfda.pharm_class_moa` (7.80), `openfda.pharm_class_pe` (5.80) — thin, and `therapeutic_category` at 100% already provides the class axis.
- `change_date` (0.69), `related_info_link` (2.18), `resolved_note` (0.37) — below the floor.
- `proprietary_name` (0), `strength` (0), `openfda.dosage_form` (0), `openfda.upc` (0), `openfda.is_original_packager` (0), `openfda.original_packager_product_ndc` (0) — published but never populated. `proprietary_name` at 0% is notable: the brand name is carried only in `openfda.brand_name`, which is why that field is exposed despite the top-level `generic_name` being at 100%.

**Deviations from the plan's seeded list:** `openfda.generic_name` **dropped** — not in
`drugshortages.yaml`, so it fails criterion 1. `openfda.substance_name` (88.96) is exposed
in its place, and the top-level `generic_name` (100) already provides the generic-name
search the seeded field was reaching for, so nothing is lost. The other 10 seeded fields
kept. Added 3: `openfda.substance_name`, `openfda.product_ndc`, `update_date`.

---

## Catalog issues to report

Recorded here, not fixed — Task 3 does not touch catalog files.

1. **`drug-ndc` is missing `labeler_name`.** The plan read it from a live record on
   2026-09-20 and it is a well-known, fully populated field on `/drug/ndc.json`, but FDA's
   published `drugndc.yaml` does not list it, so it is absent from
   `src/catalog/drug-ndc.json` and from the coverage measurement. This is a gap in FDA's
   reference, not in Tasks 1–2. `openfda.manufacturer_name` (81.24) covers the same query
   at lower coverage. Worth revisiting if FDA updates the YAML.
2. **`drug-ndc` `marketing_start_date` has `type: "type"`.** Every other entry carries a
   real type (`string`, `array`, `object`, `boolean`, `number`, `unknown`). This one reads
   `"type"`, which looks like a key/value mix-up while parsing the YAML — either in FDA's
   source or in the Task 1 downloader. The field itself is a date at 100% coverage and is
   exposed; only the recorded type is suspect. A descriptor task that keys off `type`
   should be aware of it.
3. **`meta.*` is in the `label` and `enforcement` catalogs (9 entries each, 18 total).**
   These are openFDA's response-envelope fields, not record fields. FDA's reference
   documents them alongside the record, so the downloader picked them up correctly; they
   measure 0% because no record contains them. They must never be exposed. This is expected
   behaviour, not a bug, but it is unexplained if you only look at the coverage numbers.
4. **`type: "unknown"`** appears on a handful of entries (`enforcement.product_type`,
   `label.meta.type`, `event.patient.drug.drugrecurrence`) where FDA's YAML omits a type.
   Only `enforcement.product_type` matters for selection, and it is rejected on other
   grounds anyway.

## Totals

| endpoint | catalog fields | exposed | seeded | kept | dropped | added |
| --- | --- | --- | --- | --- | --- | --- |
| label | 207 | 15 | 9 | 9 | 0 | 6 |
| event | 99 | 18 | 9 | 9 | 0 | 9 |
| ndc | 39 | 16 | 10 | 9 | 1 | 7 |
| enforcement | 56 | 17 | 12 | 11 | 1 | 6 |
| drugsfda | 49 | 20 | 25 | 18 | 7 | 2 |
| orangebook | 31 | 12 | 9 | 8 | 1 | 4 |
| shortages | 41 | 13 | 11 | 10 | 1 | 3 |

111 fields across seven tools, every one within the 10–20 target.
Every row satisfies kept + dropped = seeded and kept + added = exposed.
