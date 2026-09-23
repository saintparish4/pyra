# ADR-0004: `@pyra/neris` is generated in-repo, and the output is checked in

**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Saint (Bluesky Labs)

## Context

`@pyra/neris` has been deliberately empty since the repo was created, on the principle that a
field invented now is a field un-invented later. The dictionary is now on disk:
`NERIS/openapi.json` (OpenAPI 3.1.0, NERIS v1.4.78 — 738 component schemas, 153 enums) plus
`NERIS/CORE/value_sets/yml/` (96 value sets with human descriptions, definitions, an `active`
flag, and an `NFIRS Crosswalk` column on `type_incident.yml`).

That checkout is gitignored: it is upstream's to version, and mirroring it here would mean
maintaining a copy that silently goes stale.

Three things rule out the obvious options:

1. **Transcribing by hand is not on the table.** 130 incident types alone, across 96 value sets,
   changing upstream.
2. **Types-only generators are not enough.** Offline inline validation is a headline feature, so
   validation has to exist at *runtime*, in the browser, from the same definitions the server
   uses. That means zod schemas, not `.d.ts`.
3. **The output needs repo-specific shaping.** zod v4 idioms; `active: 'FALSE'` values readable
   but not offerable for new records; descriptions carried through as UI labels; the NFIRS
   crosswalk emitted as *data* keyed by NFIRS code; and the API/YAML disagreement resolved in a
   specific direction.

That last point is not hypothetical. `type_incident.yml` has 127 entries; `TypeIncidentValue` in
the spec has 130. The API adds `LAWENFORCE`, `MEDICAL||ILLNESS`, and `MEDICAL||INJURY`, and
fixes the YAML's typo `BACKOUNTRY_RESCUE` → `BACKCOUNTRY_RESCUE`. The YAML also separates
levels with `: ` where the API uses `||`. Upstream says the API is authoritative; this proves it.

## Decision

**An in-repo generator — `packages/neris/scripts/generate.ts` — reads the local `NERIS/`
checkout and emits TypeScript under `packages/neris/src/generated/`. That output is committed.**

No `openapi-zod-client` / `orval` toolchain.

Generated modules:

- `valueSets.ts` — every `Type*Value` enum as a const tuple plus a zod enum, joined to the YAML
  for `description` / `definition` / `active`. **The API is authoritative for membership; the
  YAML is authoritative for labels.** Values present in the API but missing from the YAML fall
  back to their own value as the label and are reported on stderr; values in the YAML but not
  the API are dropped and reported.
- `schemas.ts` — zod schemas for the payload subgraph (464 schemas reachable from
  `IncidentPayload`, `PutIncidentPayload`, `PatchIncidentAction`, `CreateDepartmentPayload`,
  `CreateStationPayload`, `CreateUnitPayload`, `NoActivityReportPayload`, plus responses),
  handling the FastAPI idioms: `anyOf: [X, null]` as `.nullable()`, `$ref` cycles via
  `z.lazy()`, and property-level `oneOf` + `discriminator.mapping` as
  `z.discriminatedUnion()`.
- `nfirsCrosswalk.ts` — `Record<NfirsCode, TypeIncidentValue[]>`. **Arrays, always** (ADR
  context: 161 of 164 NFIRS codes map to more than one NERIS type, and code `300` maps to 54).
  The type signature is the point: it makes the ambiguity impossible to ignore downstream.
- `version.ts` — `NERIS_SPEC_VERSION` plus a sha256 of the source spec.

**Why the output is committed:** a dictionary bump shows up as a reviewable diff. A reviewer can
see that `TRASH_RUBBISH_FIRE` gained a level or that a value went inactive, in the PR, without
running anything. Generating at build time would hide exactly the change we most need to see —
and it would make `NERIS/`, a gitignored checkout, a build dependency for every contributor and
for CI.

**Drift detection is a separate, scheduled job.** `scripts/checkSpec.ts` fetches the live
`openapi.yaml` and fails on hash drift. It runs on a schedule, never on the PR job: a PR must
not go red because upstream shipped something on a Tuesday.

## Consequences

**Positive**

- One definition of a NERIS value, shared by the server, the browser, and the importer.
- `pnpm --filter @pyra/neris generate` is the entire upgrade procedure for a dictionary bump.
- The generated diff is the change review. Nothing about a NERIS release is invisible.
- Only new dependency is a generator-only devDependency on `js-yaml`, already resolved in the
  lockfile.

**Negative / accepted risks**

- **We own a generator.** Every FastAPI idiom the spec uses is one we have to handle, and the
  spec will add idioms we have not seen. Mitigated by failing loudly: an unrecognised construct
  throws during generation rather than emitting a permissive `z.unknown()`.
- Committed output means merge conflicts in generated files on concurrent branches. Resolution
  is always "regenerate", never "hand-merge" — and a golden test enforces it.
- The generator is one more thing to read before changing value-set handling.

**The guard rail:** a golden test asserts that **regenerating produces no diff**. If someone
hand-patches `src/generated/`, CI fails. That is what keeps "generated" true.

## Revisit triggers

- **We hand-patch the generated output**, or a NERIS release needs structural work on the
  generator rather than a re-run. Either is the signal that the bespoke path has stopped being
  cheaper than the toolchain → switch to `openapi-zod-client` and accept the dependency.
- **The generator passes ~1,000 lines of code.** It is **678 lines** as written (803 including
  comments), across five modules in `scripts/`. The build plan estimated a 600-line trigger
  before the generator existed; the measured figure is recorded here instead, so the threshold
  is calibrated against the real thing rather than against a guess. Roughly half of it is spec
  loading and naming — the part that grows with a NERIS release is the zod emitter (131 lines),
  and that is the number to watch.
- NERIS publishes official TypeScript or zod bindings → drop ours and consume theirs.
- The spec starts using constructs the generator cannot express (`allOf` composition chains,
  recursive `$dynamicRef`) → reassess before extending.
