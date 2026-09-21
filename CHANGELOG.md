# Changelog

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
