# openFDA MCP server — bug-fix release design

Date: 2026-09-18
Source: `BUGFIX_PROMPT.md` (findings observed against published 1.0.19)
Target version: **1.1.0** (minor — tool output shape changes)

## Scope

In: P0-1, P0-2, P1-1, P1-2, P2-1, P2-2, P2-3, and the cheap P3 items
(P3-1, P3-4, P3-5, P3-6, P3-7).

Deferred, with reasons:

- **P3-2** (generic-name lookups surface only repackagers) — needs a relevance
  heuristic for "originator label", which is a design problem in its own right,
  not a bug fix.
- **P3-3** (adverse-event aggregation via `count=`) — new tool surface, not a
  defect. Verified the API supports it; worth its own release.
- **`.env` loading** — this release only corrects the documentation and error
  text. Making `.env` functional is a follow-up.

## Verification of the brief against current `main`

Every finding was re-checked. The brief's line numbers are stale: the tree was
refactored after it was written. `src/index.ts` is 53 lines, all handlers live
in `src/drug/`, and `src/OpenFDAClient.ts` does not exist — it is
`src/ApiHandler.ts`.

Confirmed reproducing:

| Item | Location on current `main` |
|---|---|
| P0-1 | **four** sites, brief said one: `get-drugsfda.ts:53`, `get-drug-by-name.ts:34`, `get-drug-by-product-ndc.ts:45`, `get-drugs-by-manufacturer.ts:44` |
| P0-2 | `src/OpenFDABuilder.ts:71` |
| P1-1 | `src/drug/get-drug-safety-info.ts:52-65` |
| P1-2 | `src/drug/get-drug-safety-info.ts:55` |
| P2-1 | `src/drug/get-drug-by-product-ndc.ts:18` **and** `src/utils/ndc.ts:40` — duplicated strict regex |
| P2-2 | `meta.results.total` discarded in all list tools |
| P2-3 | exact `openfda.brand_name` search only |

### Corrections to the brief

1. **The PLR field is `warnings_and_cautions`, not `warnings_and_precautions`.**
   Verified against live labels: Jantoven, Zoloft, OxyContin and Lipitor all
   expose `warnings_and_cautions`; `warnings_and_precautions` does not exist.
   Implementing the brief's snippet verbatim would have shipped a permanently
   empty field.
2. **The brief's `URLSearchParams` fix breaks `get-drug-adverse-events`.**
   That handler builds `+AND+` into the search string. Encoded, `+` becomes
   `%2B` and the query returns `NOT_FOUND`. Measured:
   raw `+AND+` → 293489 results; encoded `+AND+` → NOT_FOUND;
   encoded `" AND "` → 293489. The space form is required.
3. **Silent degradation to the keyless tier is the wrong fix for P0-2.** See §2.

Also confirmed: Lipitor genuinely has no `boxed_warning` upstream, so the
brief's control case is real; citalopram total is 91; `58151-155` (5-3) is a
valid product NDC returning 1 result; `spl_product_data_elements` resolves both
Cordarone and Glucophage, which exact brand search cannot.

## §1 — Security: API key leak (P0-1)

Structural fix: handlers never hold a URL. The URL stays between the builder
and `makeOpenFDARequest`; the returned `error` object carries no URL.

- Remove `${url}` from all four leak sites.
- Add `src/utils/redact.ts` exporting
  `redactApiKey(s) => s.replace(/([?&]api_key=)[^&\s]*/gi, '$1<REDACTED>')`
  for any future logging path.
- Recurrence guard: a test that scans `src/**` for a URL-bearing variable
  interpolated into a `text:` template and fails the suite.

**Operational, not code:** the leaked key is present in published 1.0.19's
`dist/` and in on-disk transcripts. It must be rotated at
https://open.fda.gov/apis/authentication/ regardless of this fix.

## §2 — Missing API key: fail fast (P0-2)

Rejected the brief's "degrade silently to the keyless tier" because:

1. **Keyless is unobservable.** A keyed request returns `x-ratelimit-limit: 240`
   and a remaining counter; a keyless request returns no rate-limit headers at
   all (measured). Nothing can see how close it is to the cap.
2. **Exhausting the cap is a worse bug than the one being fixed.**
   `ApiHandler.ts:28` treats 429 as retryable and `:117` retries with
   exponential backoff, so a concurrent workload degrades into slow,
   intermittent, partial failure rather than a clean error.
3. **It is deceptive given the `.env` trap.** Nothing loads `.env` (no `dotenv`
   dependency, no import; `OpenFDABuilder.ts:65` reads `process.env` directly),
   so the person most likely to hit this path believes they configured a key.

Design:

- **Guard at tool-call time, not startup.** A stdio server that exits at startup
  gives the client an opaque "failed to connect"; an `isError` tool result puts
  actionable text into the agent's context and the transcript, which is where
  the original misdiagnosis happened.
- **One chokepoint:** the guard lives in `ToolManager.registerTool`, which
  already wraps every tool. All 8 tools get it; future tools inherit it.
- **Message** (never echoes the key):
  `OPENFDA_API_KEY is not set. This server reads the key from its process
  environment; a .env file is not loaded. Add it to the "env" block of your MCP
  client config. Get a free key at https://open.fda.gov/apis/authentication/`
- **One-time stderr warning at startup** for whoever watches logs.
- **Escape hatch:** `OPENFDA_ALLOW_KEYLESS=1` explicitly permits the keyless
  tier, with a loud stderr warning about the 40 req/min cap and the absence of
  rate-limit visibility. Never triggered by accident.
- **`URLSearchParams` is still adopted**, for a reason independent of the key:
  raw interpolation does not encode user input, so a drug name containing `&`
  or `#` corrupts the query. Comes with the mandatory `+AND+` → `" AND "`
  change in `get-drug-adverse-events`.

Consequence worth noting: once absent-key is handled separately,
`ApiHandler.ts:86`'s `Forbidden: API key may be invalid or quota exceeded`
becomes accurate, since the only way to reach it is a present-but-bad key.

## §3 — Label field mapping (P1-1, P1-2, P3-1)

New `src/drug/label-fields.ts`, one mapper shared by `get-drug-safety-info` and
`get-drug-by-name`.

- Add `boxed_warning`.
- Add `warnings_and_cautions` (the verified PLR field name).
- `warnings` falls back: old-format `warnings` → PLR `warnings_and_cautions`.
- **Every mapped key is always present, defaulting to `[]`.** This is what makes
  "this drug has no boxed warning" distinguishable from "this server never maps
  the field" — the actual P1-1 complaint.
- Resolves P3-1: the five fields `get-drug-by-name`'s description promises
  become present-and-empty rather than absent.

## §4 — NDC acceptance (P2-1)

- Widen `normalizeNDC` to accept 5-3, 5-4, 5-4-2, 5-3-2, and 9/10/11-digit
  forms; drop the strict `/^\d{5}-\d{4}$/` at `src/utils/ndc.ts:40`.
- Delete the duplicate check at `get-drug-by-product-ndc.ts:18`; call the shared
  helper instead, so the two NDC tools cannot disagree again.
- Update the `describe()` text and the error message to match what is accepted.
- No zero-padding: `58151-0155` is a different NDC, not a normalization of
  `58151-155`.

## §5 — Result totals (P2-2)

New `src/utils/format.ts` with `formatListResponse`, threading
`meta.results.total` into both the prose header (`Showing 3 of 91 matching
labels`) and the structured payload. Applied to every list-returning tool.

## §6 — Brand-name resolution (P2-3)

New `src/drug/resolve-label.ts`. Tiered lookup, stopping at the first tier with
results so the common case stays a single request:

1. `openfda.brand_name`
2. `openfda.generic_name`
3. `openfda.substance_name`
4. `spl_product_data_elements`

Each tier is a separate sequential query, not one OR-ed query, so relevance
ordering stays predictable. `matched_via` records the exact field that matched,
so the caller can tell the match was indirect. On total
miss, return real suggestions — the README already claims this and the code does
not do it.

## §7 — Cheap P3 items

- **P3-4** map FAERS `reactionoutcome` codes 1–6 to labels.
- **P3-5** deduplicate reaction arrays.
- **P3-6** document `get-drugsfda`; add it to the README `autoApprove` array.
- **P3-7** README: use `["-y", "@ythalorossy/openfda"]` in the example config;
  correct the `.env` instructions to point at the MCP client `env` block.

## §8 — Testing

Captured real openFDA responses, trimmed to the fields under test, committed to
`tests/fixtures/`, with `fetch` stubbed. Offline, deterministic, no rate-limit
consumption.

Cases:

1. `redactApiKey` strips the key from a URL-bearing string (P0-1)
2. No tool output contains `api_key`, including error paths (P0-1)
3. Source scan: no URL variable interpolated into a `text:` template (P0-1)
4. Missing key returns an actionable error and makes **zero** network requests
   (P0-2) — replaces the brief's "builder omits api_key" test
5. `OPENFDA_ALLOW_KEYLESS=1` permits the request and omits `api_key` (P0-2)
6. Query encoding: `AND` filters survive encoding; a drug name containing `&`
   is encoded correctly (P0-2, regression guard for correction #2)
7. `boxed_warning` populated for Jantoven, `[]` for Lipitor (P1-1)
8. `warnings` non-empty for a PLR label such as Zoloft (P1-2)
9. NDC normalizer accepts 5-3, 5-4, 5-4-2, 9- and 11-digit; rejects garbage (P2-1)
10. A list response reports a total distinct from the requested limit (P2-2)
11. Tiered resolution finds Cordarone via the SPL tier and sets `matched_via` (P2-3)

## Out of scope

P3-2, P3-3, functional `.env` loading. Key rotation is an operational task for
the owner, not a code change.
