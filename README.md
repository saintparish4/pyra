# Pyra

**Status:** early planning — not a shippable product yet. **Currently blocked on NERIS** (see below).

> **⏸ Waiting on NERIS for the official data dictionary.**
> Pyra's incident model is built directly against the NERIS data dictionary, so we are holding at Phase 0 until we have the official dictionary and sandbox access from UL/FSRI. Everything downstream — `packages/neris` types and validators, the incident form, submission, and the importer's target schema — depends on it, and building against a guess would mean rewriting all of it.
>
> **What's moving in the meantime:** repo scaffolding, auth and tenancy, the app shell and landing site, deploy tooling, and docs — the parts that don't encode the schema. **What's paused:** anything that models NERIS entities or fields.
>
> If you work with NERIS integration at UL/FSRI, or you're a department willing to be a pilot, we'd like to hear from you — [open an issue](https://github.com/saintparish4/pyra/issues).

We're building a free, open-source (AGPL-3.0), self-hostable records management system for US fire departments — with a planned low-cost hosted co-op tier for departments that don't want to run infrastructure, governed by a nonprofit/cooperative so it cannot be acquired.

**Pitch to a chief (target):** "Own your records forever. Report to NERIS. Pay nothing, or pay us server costs — never a PE markup."

---

## The problem

Three PE-backed vendors (ESO, ImageTrend, First Due) control the records management software market for the ~30,000 US fire departments. Their playbook — acquire competitors, sunset products, raise prices — has doubled or tripled costs for departments, with volunteer departments (roughly two-thirds of the market) hit hardest. Departments stay because their historical data (incidents, training records) is held hostage in proprietary systems.

The January 2026 NFIRS→NERIS federal transition forcibly rearchitected every department's reporting pipeline. Switching costs are at a historic low, and the new federal system (NERIS) has a published data dictionary and API. This is the window.

## What we're aiming for

- **Own your data** — full export in open formats, anytime; no lock-in
- **Report to NERIS** — create, validate, submit, and track status against the federal standard
- **Self-host for free** — run it on a small server for the cost of electricity and hardware
- **Or use the co-op** — a low-cost hosted tier that covers server costs, not PE margins
- **Cannot be acquired** — nonprofit/cooperative governance keeps the mission locked in

## Goals & non-goals (MVP)

### Goals

- NERIS-compliant fire incident reporting (create → validate → submit → track status)
- Data liberation: import historical records from NFIRS flat-file exports and at least one major vendor export format
- Department roster and role-based access
- Export-everything guarantee (full data export in open formats, one click)
- Deployable by a semi-technical volunteer in under an hour (Docker Compose)

### Non-goals

Explicit, to protect scope:

- **EMS ePCR / NEMSIS reporting** — HIPAA + state certification swamp; revisit v2+
- **CAD integration** — politically gated, per-jurisdiction; post-MVP
- **Scheduling / shift management** — commodity feature, later module
- **Public-facing incident map** — separate product, after RMS traction
- **Billing, hydrant management, inspections / pre-plans** — later modules
- **Mobile native apps** — PWA only for MVP

## Users & personas

| Persona | Context | Primary jobs |
|---|---|---|
| **Chief / Assistant Chief** (volunteer dept, 20–40 members) | Non-technical, time-poor, budget-anxious | Compliance sign-off, grant reporting, ISO reviews |
| **Incident Officer / Report Writer** | Fills reports after calls, often on phone at the station or home | Complete an incident report fast, correctly, sometimes offline |
| **Training Officer** (fast-follow) | Tracks certifications, drills | Log training, prove compliance |
| **Quartermaster** (fast-follow) | Apparatus & SCBA checks | Daily/weekly checklists |
| **Department Admin** | The one member who "does computers" | Deploy, back up, manage users, run imports |

## Roadmap

### Phase 0 — Discovery & foundations

- Enroll with NERIS/UL as integration vendor; obtain sandbox + data dictionary ← **critical path, currently blocking everything below it**
- 8–10 chief interviews (Maine/NM departments quoted in press = warm leads); capture report-writing workflow on video if permitted
- Model the NERIS data dictionary into `packages/neris` types + zod validators — **paused pending the dictionary**
- Repo scaffolding; auth + tenancy walking skeleton
- Form entity decision (or park under fiscal sponsor) before any money moves
- **Exit criteria:** sandbox credentials in hand; schema for incident core drafted; 3 pilot-interest commitments

### Phase 1 — Core domain

- Departments, users, roles, RLS policies + tests that prove tenant isolation
- Incident CRUD with progressive-disclosure form; inline NERIS validation; draft autosave
- Audit log infrastructure
- Seed data + demo department for development and screenshots
- **Exit criteria:** a report writer persona can complete a routine incident end-to-end locally in <5 min

### Phase 2 — NERIS integration

- Submission client with retry queue (pg-boss), status tracking, rejection surfacing
- Amendment workflow
- Contract tests against the NERIS sandbox; begin FSRI compatibility testing process
- **Exit criteria:** sandbox submissions accepted; compatibility badge process formally underway

### Phase 3 — Importer

- Parser framework + staging tables + mapping-review UI + dry-run
- NFIRS flat-file parser first (public format, historical data everyone has); Emergency Reporting CSV second (needs sample exports from pilots)
- Import 20+ years of a real pilot department's data as the acceptance test
- **Exit criteria:** one real department's full history imported with <1% unresolved records

### Phase 4 — Offline + hardening

- PWA offline draft queue + background sync (deliberately late: sync bugs are expensive; core must be stable first)
- One-click full export; automated backups; restore drill documented and rehearsed
- Security pass (ASVS L2 checklist), rate limiting, dependency audit
- Deploy docs tested by a stranger ("volunteer admin installs in <1 hr" test)
- **Exit criteria:** a non-contributor deploys from docs alone; restore drill passes

### Phase 5 — Pilot

- 3–5 departments live, free, weekly feedback loop; run their migrations personally (this is discovery, not a chore)
- Stand up hosted instance for departments that opt out of self-hosting
- Finish FSRI badge; publish case study #1 ("Department X left ESO, saved $Y, kept 20 years of records")
- **Exit criteria:** 90 consecutive days of production reporting at ≥3 departments; badge secured

## License

[AGPL-3.0](./LICENSE)
