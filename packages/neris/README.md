# @pyra/neris

NERIS types, value sets, and the NFIRS crosswalk. **Everything under `src/generated/` is
generated from the official dictionary and committed.** Nothing here is hand-written from
guesswork — see [ADR-0004](../../adr/0004-neris-generated.md).

## Generating

The generator reads a local checkout of
[`ulfsri/neris-framework`](https://github.com/ulfsri/neris-framework). Clone it to `NERIS/` at
the repo root (that path is **gitignored** — the framework is upstream's to version, and
mirroring it here would mean maintaining a copy that silently goes stale), or point
`NERIS_FRAMEWORK_PATH` at it:

```bash
git clone https://github.com/ulfsri/neris-framework NERIS
pnpm --filter @pyra/neris generate
pnpm --filter @pyra/neris test
```

`generate` is the entire upgrade procedure for a dictionary bump. **Commit the diff in
`src/generated/` — that diff is the change review.** A reviewer can see that a value went
inactive or a type gained a level without running anything.

Generation prints a report to stderr for the two ways the API and the value sets disagree:
values the API carries that the YAML does not (labelled by their own value), and values the
YAML carries that the API does not (dropped). Both are expected today; neither is silent.

## What it emits

| Module | Contents |
| --- | --- |
| `valueSets.ts` | Every enum in the spec as a const tuple, a zod enum, and — where a value-set YAML exists — a `ValueSetEntry` per value with `label`, `labelPath`, `levels`, `definition`, `source`, `active` |
| `schemas.ts` | zod schemas for the ~550 component schemas reachable from the incident, entity, and error roots, with a `z.infer` type alias each |
| `nfirsCrosswalk.ts` | `Record<NfirsCode, readonly TypeIncidentValue[]>` — NFIRS 5.0 code to the NERIS types it could mean |
| `version.ts` | `NERIS_SPEC_VERSION`, the sha256 of the source spec, the schema digest, and the server the snapshot describes |

Hand-written alongside it: `valueSetHelpers.ts` — `offerableValues`, `labelOf`, `childrenOf`.

## Three things the dictionary will surprise you with

**The API and the YAML disagree, and the API wins.** `type_incident.yml` has 128 entries;
`TypeIncidentValue` in the spec has 130. The spec adds `MEDICAL||ILLNESS` and `MEDICAL||INJURY`,
and fixes the YAML's typo `BACKOUNTRY_RESCUE` → `BACKCOUNTRY_RESCUE`. The YAML also separates
hierarchy levels with `: ` where the API uses `||`. Upstream states the API is the source of
truth: **membership comes from `openapi.json`, labels come from the YAML.**

**Types are variable depth.** `LAWENFORCE` has one level, `MEDICAL||ILLNESS` two,
`FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE` three. A type picker that assumes three levels is
wrong for a third of the dictionary. Use `childrenOf()`.

**The NFIRS crosswalk is not a function.** 161 of its 164 codes map to more than one NERIS type,
and code `300` maps to 53. `nfirsCrosswalk` is therefore typed as arrays, always — the signature
is what makes the ambiguity impossible to ignore. An importer that applies it automatically will
silently mis-type most of a department's history, which is why Phase 5 has a mapping-review step
(see [ADR-0005](../../adr/0005-imports-are-records.md)).

## Drift

```bash
pnpm --filter @pyra/neris check-spec
```

Fetches `openapi.yaml` from the live API and fails if the version or the schema digest has moved
away from what `src/generated/` was built from. It runs on a **schedule**
(`.github/workflows/spec-drift.yml`), never on the pull-request job: a contributor's PR must not
go red because upstream shipped a release on a Tuesday.

The digest is computed over the canonicalised schema graph rather than over raw bytes, because
the local snapshot is JSON and the live spec is YAML.

## Tests

`src/dictionary.test.ts` asserts the facts above against the **committed** output, so it runs in
CI with no framework checkout. `scripts/generate.test.ts` is the golden test — regenerating
produces no diff — and skips itself when `NERIS/` is absent.

If you find yourself editing a file under `src/generated/`, the golden test will fail and it is
right to. Change the generator.

## What is deliberately not here

The conditional-requirement layer. 205 fields are `neris_core`, 106 carry a `possible_if`, 33 a
`neris_core_if`, all written as inconsistent prose, and further rules live only in OpenAPI
`description` strings — a `FIRE||STRUCTURE_FIRE` incident requires the alarm and suppression
modules *unless all aids are `SUPPORT_AID` `GIVEN`*; a single `UNDETERMINED` type is CAD-only.

**Generated schemas give shape. Conditionality has to be hand-written**, as named functions with
stable codes under `src/rules/`, returning `{ code, path, message, severity }[]` so a form can
distinguish *blocks submission* from *NERIS would accept this but it is thin*. That is Phase 3,
and it is where the test pyramid is deliberately heaviest.

The submission client is Phase 4 and is blocked on integration credentials, not on anything in
this package.
