# @pyra/neris

NERIS types and value sets. **This package is deliberately empty.**

Types come from the official NERIS dictionary after UL enrollment. Nothing here
is hand-written from guesswork — a field we invent now is a field we have to
un-invent later, and every consumer (`@pyra/db`, `@pyra/import`, the API) would
carry that mistake.

## The reference dictionary

Clone [`ulfsri/neris-framework`](https://github.com/ulfsri/neris-framework) to `NERIS/` at the
repo root to work against it. That path is **gitignored** — the framework is upstream's to
version, and mirroring it here would mean maintaining a copy that silently goes stale. What
lands in this package is generated output, which is ours.

Paths below are relative to that local checkout:

| Path | Contents |
| --- | --- |
| `NERIS/CORE/modules/yml/` | Core module field metadata — dispatch, entity, incident, plus shared and augmentation modules |
| `NERIS/CORE/value_sets/yml/` | 96 value sets (`type_incident`, `type_unit`, `type_action_tactic`, …) as `CAPITAL_CASE` enums |
| `NERIS/SECONDARY/` | Community Risk Reduction, Incident Analysis, Health & Safety — still in development upstream |
| `NERIS/MAPPINGS/` | `map_location.csv` (NENA CLDXF location mapping) and the dispatch-code → incident-type template |
| `NERIS/openapi.json` | OpenAPI 3.1.0 spec, NERIS v1.4.78, against `https://api-test.neris.fsri.org/v1` |

Read `NERIS/CORE/modules/README.md` for the meaning of the metadata columns
(`neris_core`, `possible_if`, `cardinality`, `computed_from`, …) — they encode
conditionality and required-ness that our schemas will have to reproduce.

## Why it's still blocked

The upstream repo is the *published* framework. What enrollment unlocks is the
production API and its authoritative schema:

- Access to the live NERIS API rather than `api-test`.
- Confirmation that `openapi.json` v1.4.78 matches what we'll actually submit
  against. Upstream states the API — not these files — is the source of truth,
  and the secondary schemas are explicitly still moving.
- A department's NERIS entity ID, without which nothing can be submitted.

## When it unblocks

Generate; don't transcribe. The dictionary is ~100 value sets and a dozen
modules, all machine-readable, and it will keep changing upstream.

1. Generate value-set unions from `NERIS/CORE/value_sets/yml/` — each file's
   keys are the enum members, and `active: 'FALSE'` entries must be readable but
   not offerable for new records.
2. Generate request/response types from `NERIS/openapi.json`.
3. Check the generated output into `src/` so a dictionary bump shows up as a
   reviewable diff.

`type_incident.yml` carries an `NFIRS Crosswalk` column — that's the seam
`@pyra/import`'s `nfirs-flatfile` parser maps through, so generate it as data,
not just as types.
