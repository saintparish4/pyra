# ADR-0005: Historical imports are records, not NERIS submissions

**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Saint (Bluesky Labs)

## Context

The importer is Pyra's switching argument. A department will not move off an incumbent RMS if
moving means abandoning forty years of incident history, so "bring your history with you" is
the feature that makes the rest of the product reachable.

That history is NFIRS-era: pipe-delimited NFIRS 5.0 flat files and vendor CSV exports, going
back decades. NERIS is the *current* reporting standard. The two are not the same kind of
object, and the NFIRS→NERIS crosswalk is not a function — 161 of 164 distinct NFIRS codes map
to more than one NERIS incident type, and code `300` maps to 54.

So an imported 1987 structure fire is two things at once: a record the department owns and
needs, and a payload that would be wrong to send anywhere.

## Decision

**Imported incidents are stored, searchable, and exportable. They never enter the NERIS
submission pipeline.**

Mechanically:

- Every incident row carries `source`. Imported rows get `nfirs_import` or `vendor_import`.
- The submission path — local rules → `/incident/{entity}/validate` → `POST /incident/{entity}`
  — **filters on `source`**. An imported row is not eligible, and the check lives in the
  submission procedure, not only in the UI.
- The original vendor row is preserved verbatim in `import_records.raw jsonb` (PRD 6.2). The
  mapped payload is a derived artefact; the raw row is the record of what the department
  actually had.
- Imported incidents are visible, searchable, and included in the one-click full export. They
  are the department's data. They are just not NERIS's.

The NFIRS type crosswalk is applied through a **human mapping-review step**, not automatically.
The importer surfaces the candidate set per NFIRS code, preselects a default by a documented
heuristic, and persists the department's choices in `nfirs_type_mappings` for reuse on every
later run. An importer that applies an ambiguous crosswalk silently will mis-type most of a
department's history, and the department will not find out until an audit.

## Consequences

**Positive**

- "Import forty years of history" stays a two-week feature instead of a compliance incident.
- Phase 5 needs no NERIS credentials at all — the importer is fully buildable while Phase 4 is
  blocked on account questions.
- The raw-row guarantee is a data-sovereignty claim Pyra can make literally: what you gave us is
  still exactly what you gave us.

**Negative / accepted risks**

- Two classes of incident in one table, distinguished by a column. Any query that means "things
  we report on" has to say so. Mitigated by making `source` a first-class envelope column
  (ADR-0002) rather than a payload field.
- Imported rows will not satisfy the NERIS `neris_core` required set, and should not be asked
  to. Validation severity is therefore `source`-aware: a missing core field on an imported 1994
  record is not an error, on a manual 2026 record it is.
- A department that genuinely wants to backfill NERIS with recent history has no path here.
  That is deliberate: it is a different feature with a different risk profile, and it needs
  NERIS's own position on backfill before it is designed.

## Revisit triggers

- NERIS publishes a supported backfill or historical-submission path → design it explicitly,
  as a separate flow with its own confirmation step. It does not become a flag on the importer.
- A regulator requires historical resubmission → reopen, and expect the mapping-review step to
  become mandatory rather than advisory.
