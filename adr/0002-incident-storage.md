# ADR-0002: Incident storage — typed envelope, validated JSONB payload

**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Saint (Bluesky Labs)

## Context

NERIS is the data model Pyra exists to serve, and it is still moving. The v1.4.78 snapshot in
`NERIS/openapi.json` carries **738 component schemas**, of which **464 are reachable from the
incident payload roots alone**. Upstream states the API — not the published YAML — is the
source of truth, and that the secondary schemas (Community Risk Reduction, Incident Analysis,
Health & Safety) are explicitly still in development.

Two shapes were available:

1. **Normalize.** Mirror the NERIS modules into SQL tables — incident, dispatch, unit
   responses, location, exposures, casualties, the fire/hazsit/medical detail modules, the four
   alarm modules, and so on.
2. **Envelope + document.** First-class columns for the fields Pyra itself queries on, and one
   `jsonb` column holding the NERIS-shaped payload.

The deciding number is the cost of an upstream dictionary bump. Under (1) a minor NERIS release
is a multi-table migration written by hand against a spec diff. Under (2) it is a regeneration
of `@pyra/neris` and a reviewable diff.

ADR-0001 already committed to JSONB "for flexibility across NERIS schema versions." This record
makes that concrete and states what it costs.

## Decision

An `incidents` table with **first-class SQL columns for everything Pyra queries, filters,
sorts, or joins on**, and a `payload jsonb` column holding the NERIS `IncidentPayload`.

Envelope columns:

| Column | Why it is not in the payload |
| --- | --- |
| `id` | Pyra's own surrogate key; the NERIS id does not exist until first submission |
| `department_id` | The tenancy boundary — every RLS policy keys on it (ADR-0003) |
| `incident_number` | Department-facing identifier; searched constantly |
| `neris_id` | Assigned on first submit; the idempotency key (`FD\d{8}\|…\|\d{10}`) |
| `status` | Pyra's workflow state: draft / validated / submitted / accepted / rejected |
| `source` | `manual` / `cad` / `nfirs_import` / `vendor_import` — gates the pipeline (ADR-0005) |
| `occurred_at` | Every list view is ordered by it |
| `primary_type` | The first `incident_types` entry; drives list filtering and the form's disclosure |
| `created_by`, `submitted_at`, `updated_at`, `deleted_at` | Audit and soft-delete envelope |

The payload is **validated by the generated zod schema on every write**, in the tRPC layer,
before the row is persisted. An unvalidated payload never reaches Postgres.

A GIN index on `payload` keeps ad-hoc containment queries usable until a field earns promotion.

`incident_attachments` and `incident_submissions` are separate tables: attachments are S3 object
references with their own lifecycle, and submissions are an append-only attempt log
(request, response, status, error) that must survive the incident being amended.

## Consequences

**Positive**

- A NERIS minor release is `pnpm --filter @pyra/neris generate` plus a diff, not a migration.
- One validator, generated from the spec, guards both the API boundary and the offline form.
- The 464-schema subgraph never becomes 464 lines of hand-maintained DDL.

**Negative / accepted risks**

- **No referential integrity inside the payload.** A `unit_neris_id` in `unit_responses` is not
  a foreign key to the local roster. Cross-checks are application-level and must be tested.
- **Analytics are harder.** Reporting on a JSONB path is slower and less ergonomic than a
  column, and a typo in a path fails silently as "no rows" rather than loudly as a SQL error.
- Payload rows are larger than the equivalent normalized rows, and TOAST behaviour is harder to
  reason about for the biggest structure-fire payloads.

**Mitigations, in force from the first migration**

- zod validation at every write boundary — no raw insert path exists.
- **Promote a field to a real column the moment we filter or join on it.** A promotion is an
  additive migration plus a backfill, which is cheap; discovering six months of slow queries is
  not. Treat "I wrote a `payload ->> …` predicate in a list query" as the trigger.
- The GIN index is a bridge to promotion, not a substitute for it.

## Alternatives considered

**Full normalization of the core modules only** (incident, dispatch, unit_responses, location),
JSONB for the optional detail modules. Better reporting, more upfront work, and it still leaves
a migration to write every time a core module changes — which is where upstream churn has
actually landed. Rejected for now; the revisit trigger below is the condition that would flip it.

## Revisit triggers

- Reporting requirements outgrow JSONB paths for a **core** module (dispatch, unit responses,
  location) → normalize that module specifically, keep the rest in the payload.
- NERIS reaches a stable major version with a published deprecation policy → the migration cost
  of normalization drops, and the trade reopens.
- A payload row regularly exceeds ~1 MB → revisit the split between envelope and document.
