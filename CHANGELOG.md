# Changelog

## 2.0.1

### Fixed

- **14 of 30 declared `count` fields were rejected by openFDA.** They passed
  schema validation and every offline test, then failed at the API — a
  green unit suite over stubs does not prove the live surface works. Every
  descriptor's `countFields` is corrected to the working form (usually the
  `.exact` alternate), and a new committed countability catalog
  (`npm run fields:countable` → `src/catalog/drug-*.countable.json`) guards
  every declared count field offline, checked by
  `tests/catalog-conformance.test.ts`.
- **A rejected argument was reported as an upstream outage** — retried and
  then surfaced as "Failed to query…" — indistinguishable from openFDA
  actually being down. `src/core/http.ts` now classifies openFDA's
  `illegal_argument_exception` as `bad_request` distinctly from a genuine
  failure, and `src/ApiHandler.ts` stops retrying it.
- **The same rejected argument, on a multi-tier field with no prior hit, was
  reported as an empty dataset** — a false "No records found" — instead of
  the caller's `count` or `sort` value being invalid. `src/core/executor.ts`
  now surfaces a `bad_request` immediately instead of walking the remaining
  search tiers and reporting all-miss.
- **`count` buckets were capped at the record `limit` default** — 1 on
  `drug-label` — so an aggregation with no explicit `limit` returned a
  single bucket under a "Top 1 values" header. `limit` under `count` now
  means buckets, defaulting to `COUNT_BUCKET_DEFAULT` (100, openFDA's own
  bucket ceiling) instead of the tool's record default. An explicit `limit`
  remains capped by the tool's record `max`, so on six of the seven tools —
  every one except `drug-drugsfda` (max 100) — a caller can now *receive*
  more buckets by omitting `limit` than it can *explicitly request*; this
  asymmetry is documented, not fixed.
- **Paging had no sound advance signal.** The obvious `skip += limit` idiom
  is wrong whenever the response budget drops trailing rows: it steps over
  exactly the rows that were dropped. The envelope gains `dropped_for_budget`
  (rows dropped to fit the 60,000-character budget, always present, `0`
  included) and `next_skip` (the correct offset to resume from; `null` when
  exhausted or when the next offset would exceed `SKIP_MAX`, which moved to
  its own module, `src/core/paging.ts`).
- **`drug-shortages`'s `status` field documented a vocabulary the dataset
  does not have** (`Shortage` / `Resolved` / `Discontinued`). A caller
  filtering on those values found nothing and could not tell that from a
  product genuinely not being short. The documented vocabulary is now the
  one the dataset actually has: `Current`, `To Be Discontinued`, `Resolved`.

### Added

- `scripts/smoke-local.mjs` now drives every declared count field of every
  tool over stdio against the live API, plus dedicated cases for the
  bucket-default and paging fixes — the live proof that closes the gap a
  green unit suite over stubs left open.
- `.github/workflows/fields-drift.yml` re-probes countability weekly
  alongside the existing field-reference and populated-field checks, and
  opens an issue if openFDA remaps a field's index out from under a
  declared count field.

## 2.0.0

### Breaking

- The nine `get-*` tools are removed and replaced by one tool per openFDA drug
  endpoint. See the migration table in README.md.

### Added

- Seven endpoint tools — `drug-label`, `drug-event`, `drug-drugsfda`,
  `drug-ndc`, `drug-enforcement`, `drug-orangebook`, `drug-shortages` — each
  built from a descriptor rather than a hand-written handler.
- `detail` selects a named record shape per endpoint; `drug-label` adds
  `safety`, which replaces `get-drug-safety-info`.
- `count` aggregates on every endpoint that supports it, not only events.
  `drug-ndc` is the NDC Directory product registry, distinct from
  `drug-label`'s label-text NDC search.
- Each endpoint's full FDA field catalog is served as an MCP resource
  (`openfda://<dataset>/<endpoint>/fields`), so the long tail of fields not
  in a tool's `field` enum stays reachable at zero standing context cost.
- A weekly CI workflow (`fields-drift.yml`) re-downloads FDA's published
  field references and re-probes every exposed field, opening an issue on
  drift.

### Fixed

- **Search-value injection.** Values were interpolated raw into the query, so
  a crafted value could append a clause and make the server report data for a
  different drug than the one named in `matched_via`. All values are escaped,
  and query assembly is confined to one file with a test enforcing it.
- **A zero-match search is no longer reported as an error.** openFDA answers
  no matches with HTTP 404; that was surfaced as `isError: true` with
  "Failed to retrieve…", making "not found" indistinguishable from an outage.
- Responses are capped at 60,000 characters.
