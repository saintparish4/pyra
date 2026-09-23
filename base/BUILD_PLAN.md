# Pyra — Build Plan

**Author:** Saint (Bluesky Labs) · **Date:** 2026-08-30 · **Status:** Draft
**Supersedes the phase plan in** `PYRA_PRD.md` **Part 2** (written before the NERIS framework was in hand; the PRD's product requirements still stand).

---

## 1. Where we stand

The repo is a **complete walking skeleton with an empty core**. Everything that surrounds
incident reporting works; incident reporting does not exist.

### Built and working

| Area | State |
|---|---|
| Monorepo | pnpm 11.5.1 + Turborepo, Node 22, ESM-only, Biome 2, Husky pre-commit, CI (lint / format / typecheck / test) |
| `apps/api` | Fastify 5 + tRPC 11 + better-auth. `/health`, `/api/auth/*`, `/trpc`. Router: `health.check`, `auth.me`. pg-boss is started but registers **zero queues**. |
| `apps/web` | React 19 + Vite 8, TanStack Router (manual tree) + Query, tRPC client, better-auth client. Marketing home, `/login`, `/app` shell, 5 stub routes. `vite-plugin-pwa` precaches the app shell only. |
| `packages/db` | Drizzle + Postgres. 5 tables: `departments`, `users`, `sessions`, `accounts`, `verifications`. 2 migrations. |
| `packages/shared` | Branded `DepartmentId` / `UserId`, sign-in + session DTOs, `apiErrorSchema` envelope. 3 unit test files. |
| `packages/neris` | Deliberately empty. |
| `packages/import` | `Parser<TRecord>` interface + two empty parser folders. |
| `deploy` | Compose: Postgres, MinIO, one-shot migrate+seed, API, Nginx. |
| `docs` | Docusaurus, 5 stub pages. |
| Tests | 3 unit files, 1 integration file (auth), 2 Playwright specs. |
| ADRs | `0001-stack-choice.md` only. |

### Not built

| Gap | Consequence |
|---|---|
| **No incident model** | The product does not exist yet. Everything else is scaffolding around a hole. |
| **No NERIS types, validation, or client** | Cannot report. This was the intended blocker; it is now removable (§2). |
| **No RLS** | ADR-0001 calls row-level security "load-bearing" for the hosted tier. Nothing enforces tenancy today — there are no tenant-scoped queries yet, so retrofitting is still cheap. It will not stay cheap. |
| **Roles are `admin` / `member`** | PRD wants admin / officer / member / read-only. |
| **No audit log** | PRD 6.4 requires immutable audit on all mutations. |
| **No importer implementation** | "The crowbar" — the actual switching argument — is an interface and two comments. |
| **No export, no attachments, no offline queue** | Dexie and the S3 env vars are installed and unused. |
| **No TOTP / magic link** | `TODO(phase-h)` markers in `apps/api/src/auth/index.ts` and `apps/web/src/lib/auth.ts`. |
| Housekeeping | `CONTRIBUTING.md` is deleted (staged). `CLAUDE.md` links `AGENTS.md`, which does not exist. `apps/web/src/hero/` is untracked WIP. The PRD still uses the codename "Hydrant". |

**Assessment:** the foundation is unusually clean for this stage — the boundaries in `CLAUDE.md`
are actually respected, tests exist at all three layers, and nothing has been guessed. The
cost of that discipline was that the project has been parked waiting on NERIS. That wait is over.

---

## 2. The unblock

`NERIS/` (gitignored, upstream `ulfsri/neris-framework`) is checked out and complete:

- `openapi.json` — NERIS **v1.4.78**, OpenAPI 3.1.0, **57 paths, 738 component schemas, 153 enums, 129 `*Payload` schemas**, against `https://api-test.neris.fsri.org/v1`.
- `CORE/value_sets/yml/` — 95 value sets + 6 system value sets, with human descriptions, definitions, an `active` flag, and — on `type_incident.yml` — an `NFIRS Crosswalk` column.
- `CORE/modules/yml/` — 17 module files, ~6,000 lines of field metadata (`neris_core`, `possible_if`, `cardinality`, `computed_from`, …).
- `MAPPINGS/` — NENA CLDXF location mapping and the dispatch-code → incident-type template.

Plus: **an official NERIS account** (see §3 for what I still need from it).

### Findings from reading the spec

These are verified against the files in `NERIS/`, not inferred, and they shape the design:

1. **Two auth paths.** `POST /token` (HTTP Basic) supports grants
   `client_credentials | refresh_token | password | email_otp | software_token_mfa | new_password_required`.
   Pyra must run on **`client_credentials`** — an *integration account* with a `client_id` /
   `client_secret`, not a stored human password. The flow is:
   `POST /account/integration/{entity_id}` → returns `client_id` + `client_secret`
   (**the secret is returned once and cannot be retrieved again**) →
   `POST /account/enrollment/{entity_id}/{client_id}` grants that integration access to a
   department's data. `POST /account/credential/{client_id}` rotates the secret.

2. **There is a dedicated `validate` endpoint.** `POST /incident/{neris_id_entity}/validate`
   returns `204` or `422`. This is free authoritative validation with no side effects — it
   turns "≥95% accepted on first attempt" from a hope into a mechanical guarantee, and it
   gives us a differential-testing oracle for our own client-side rules (§5, Phase 4).

3. **Incident IDs are deterministic and immutable.**
   Pattern `^FD\d{8}\|[\w\-\:]+\|\d{10}$` — department NERIS ID, `dispatch.incident_number`,
   and the epoch seconds of `dispatch.call_create` *as first submitted*. Retries are therefore
   naturally idempotent, and an "already exists" create converts cleanly to a `PUT`.

4. **The YAML and the API already disagree — the API wins.** `type_incident.yml` has 127
   entries; `TypeIncidentValue` in the spec has 130. The API adds `LAWENFORCE`,
   `MEDICAL||ILLNESS`, `MEDICAL||INJURY`, and fixes the YAML's typo `BACKOUNTRY_RESCUE` →
   `BACKCOUNTRY_RESCUE`. The YAML also uses `: ` as its level separator where the API uses
   `||`. **Generate enum membership from `openapi.json`; use the YAML only for human labels
   and the NFIRS crosswalk.** Upstream says the API is the source of truth; this proves it.

5. **NERIS types are variable-depth.** `LAWENFORCE` (1 level), `MEDICAL||ILLNESS` (2),
   `FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE` (3). Any UI type-picker must not assume three levels.

6. **The NFIRS crosswalk is not a function.** **161 of 164** distinct NFIRS codes map to more
   than one NERIS type. NFIRS `300` maps to **54**. The crosswalk yields a *candidate set*,
   never an answer. An importer that applies it automatically will silently mis-type most of a
   department's history. This forces a human mapping-review step — which the PRD already
   assumed, and now we know exactly why.

7. **Conditional requirements are prose, not logic.** 205 fields are `neris_core: TRUE`; 106
   carry a `possible_if` and 33 a `neris_core_if`, written inconsistently
   (`ff_rescue_mayday=True`, `agency offers EMS services`, `casualty_type in ('injured nonfatally', …)`).
   Further rules live only in OpenAPI `description` strings — e.g. a `FIRE||STRUCTURE_FIRE`
   incident requires the `smoke_alarm`, `fire_alarm`, `other_alarm`, and `fire_suppression`
   modules *unless all aids are `SUPPORT_AID` `GIVEN`*; a single `UNDETERMINED` type can only
   be submitted by CAD integrations. **Generated schemas can give us shape; conditionality has
   to be hand-written.** That hand-written rules layer is where the PRD's "test pyramid
   weighted at the NERIS validation layer" actually goes.

8. **`422` maps cleanly onto what we already have.** `HTTPValidationError.detail[]` is
   `{ loc: (string|int)[], msg, type }`. Joining `loc` with `.` produces exactly the
   `Record<string, string[]>` that `apiErrorSchema.fieldErrors` in `packages/shared` already
   defines. No translation table needed.

9. **Monthly no-activity reporting is an API obligation.** `POST /no_activity_report/{entity}`
   with `{ month_year: "MM/YYYY" }`. Volunteer departments with quiet months have to file
   these. Cheap for us, annoying for them, and no incumbent makes it one click.

10. **Departments, stations, and units are NERIS entities too.** `POST /entity`,
    `/entity/{id}/station`, `/entity/{id}/station/{id}/unit`. Pyra's local roster must carry
    `neris_id` on stations and apparatus, because `unit_responses[].unit_neris_id` on every
    incident references them.

---

## 3. What I need from your NERIS access

Marked by what each item blocks. **Items A–C are hard blockers for Phase 4 only** — Phases 1,
2, and 3 are fully unblocked and are ~60% of the remaining work.

| # | Need | Why | Blocks |
|---|---|---|---|
| **A** | **Which credential type do you have?** (i) a NERIS *user* account — email + password, for the `password` grant; or (ii) an *integration* account — `client_id` + `client_secret`, for `client_credentials`. If only (i): can you reach `POST /account/integration/{entity_id}` for your entity? | Pyra must authenticate as an integration, not as a person. Capture the `client_secret` the moment it is returned — the API will not show it again. | Phase 4 |
| **B** | **Entity NERIS ID** (`FD` + 8 digits, e.g. `FD24027000`), and whether it is a real department or a test entity. | Every incident, station, unit, and no-activity call is path-scoped by it. | Phase 4 |
| **C** | **Environment + base URLs.** Confirm your credentials work against `https://api-test.neris.fsri.org/v1`, and give me the production base URL. Do test and production entity IDs differ? | We build and test against the sandbox and promote by config, not by code. | Phase 4 |
| **D** | **The live spec.** `GET {base}/openapi.yaml` from *your* environment. (`/openapi.yaml` declares no security in the snapshot — confirm whether it is actually public.) | Pins generation to the version we will really submit against instead of the repo's 1.4.78 snapshot, and lets CI detect upstream drift. | Improves Phase 1 |
| **E** | **Is MFA enforced on the user account?** (`email_otp` / `software_token_mfa` challenges.) | Only matters if we ever need the `password` grant as a fallback. | Phase 4 fallback |
| **F** | **2–3 real accepted incident payloads**, scrubbed — ideally one routine EMS/service call and one structure fire. Plus your `dispatch code → incident type` mapping spreadsheet if you have uploaded one. | Becomes the golden fixture corpus and the baseline for differential validation. Nothing else tells us what NERIS *actually* accepts versus what the schema permits. | Sharpens Phases 3–5 |
| **G** | **The FSRI/UL V1 compatibility test plan / badge process**, if any document exists. Specifically: must an integration be certified before it can enroll production entities? | Determines whether pilots can go live before the badge, which reorders Phases 4 and 7. | Phase 7 sequencing |
| **H** | **Rate limits and batch semantics.** Not stated anywhere in the OpenAPI spec. Worth one ticket to the NERIS helpdesk. | Sizes the pg-boss retry/backoff policy. | Phase 4 tuning |

If it is easier: **A, B, and C in one message** unblock everything on the critical path. D, F,
G, and H can trail.

---

## 4. Decisions to lock before building

Four decisions that are expensive to reverse later. My recommendation on each; each becomes an ADR.

### ADR-0002 — Incident storage: typed envelope + validated JSONB

**Recommend:** an `incidents` table with first-class SQL columns for everything we query on
(`id`, `department_id`, `incident_number`, `neris_id`, `status`, `source`, `occurred_at`,
`primary_type`, `created_by`, `submitted_at`, `updated_at`, `deleted_at`) plus a
`payload jsonb` holding the NERIS-shaped `IncidentPayload`, validated by the generated zod
schema on every write.

*Why:* NERIS is at v1.4.78 and moving; upstream states the secondary schemas are still in
development. Mirroring 738 component schemas into normalized tables means a schema bump is a
forty-table migration. JSONB + a generated validator makes it a regeneration and a diff.
ADR-0001 already committed to JSONB "for flexibility across NERIS schema versions."

*Cost, stated plainly:* no referential integrity inside the payload, and analytics get harder.
Mitigations: zod at every write boundary; extracted scalar columns + a GIN index for query
paths; promote a field to a real column the moment we filter or join on it.

*Alternative if you'd rather:* full normalization of the core incident modules only (incident,
dispatch, unit_responses, location) with JSONB for the optional detail modules. More upfront
work, better reporting, more migration churn. Say the word and I'll flip it.

### ADR-0003 — Tenancy: Postgres RLS behind a non-owner role

**Recommend:** migrations create a `pyra_app` role that does **not** own the tables; the API
connects as `pyra_app`; every domain table gets `ENABLE` + **`FORCE ROW LEVEL SECURITY`** with
policies on `current_setting('app.department_id')`. A `withTenant(departmentId, fn)` helper in
`packages/db` opens a transaction and `SET LOCAL app.department_id` before the callback runs.

*The carve-out:* better-auth's Drizzle adapter queries `users`, `sessions`, `accounts`, and
`verifications` directly, with no department in scope — RLS on those tables breaks sign-in. For
MVP, RLS covers domain tables (incidents, imports, audit, attachments); tenancy on the
auth-owned tables is enforced in procedure code and proven by integration tests. Written down
in the ADR because it is exactly the kind of gap that gets forgotten.

*Note:* this changes `DATABASE_URL` semantics — migrations run as owner, runtime as `pyra_app`.
Compose, `.env.example`, and the README env tables all need updating in the same phase.

### ADR-0004 — `@pyra/neris` is generated, and generation is ours

**Recommend:** an in-repo generator (`packages/neris/scripts/generate.ts`) that reads
`NERIS/openapi.json` and the value-set YAML and emits checked-in TypeScript under
`src/generated/`. No `openapi-zod-client` / `orval` toolchain.

*Why:* we need **runtime** validation on both client and server (offline inline validation is a
headline feature), so types-only generators are out; and the output needs repo-specific shaping
— zod v4, `active: FALSE` values readable but not offerable, descriptions carried through for
UI labels, the crosswalk emitted as data. Checking the output in means a dictionary bump shows
up as a reviewable diff, which is what `packages/neris/README.md` already promises.
`js-yaml@4.3.0` is already resolved in the lockfile, so the only new declaration is a
generator-only devDependency on `@pyra/neris`.

*Revisit trigger:* if the generator exceeds ~600 lines or we are hand-patching its output,
switch to `openapi-zod-client` and accept the toolchain.

### ADR-0005 — Historical imports are records, not submissions

**Recommend:** imported legacy incidents carry `source = 'nfirs_import' | 'vendor_import'` and
**never enter the NERIS submission pipeline**. NERIS takes current incidents; a 1987 structure
fire is the department's own record, stored, searchable, exportable, with the original row
preserved verbatim in `raw jsonb` (PRD 6.2).

*Why it needs saying:* it is the difference between "import 40 years of history" being a
two-week feature and a compliance catastrophe.

---

## 5. Phase plan

Estimates assume the PRD's ~15–20 focused hrs/week. **Phases 1–3 need nothing from NERIS beyond
what is already on disk.**

### Phase 1 — Generate `@pyra/neris` · ~2 weeks · *unblocked now*

Turn the dictionary into checked-in, tested TypeScript. Nothing downstream can start without it.

**Build**
- `packages/neris/scripts/generate.ts` → `src/generated/`:
  - `valueSets.ts` — every `Type*Value` enum from the spec as a const tuple + zod enum, joined
    to the YAML for `description` / `definition` / `active`. **API is authoritative for
    membership, YAML for labels.** Normalize the YAML's `: ` separator to `||`. Values present
    in the API but absent from the YAML fall back to their own value as the label and are
    reported; values in the YAML but not the API are dropped and reported.
  - `schemas.ts` — zod schemas for the payload subgraph reachable from `IncidentPayload`,
    `PutIncidentPayload`, `PatchIncidentAction`, `CreateDepartmentPayload`,
    `CreateStationPayload`, `CreateUnitPayload`, `NoActivityReportPayload`, plus response
    schemas. Handle the FastAPI idioms: `anyOf: [X, null]`, `$ref` cycles, discriminated
    present/not-present unions (`FireSuppressionPresentPayload` vs `…NotPresentPayload`).
  - `nfirsCrosswalk.ts` — `Record<NfirsCode, TypeIncidentValue[]>`. **Candidate sets, typed as
    arrays**, because 161/164 codes are ambiguous (§2.6). The type signature itself should make
    the ambiguity impossible to ignore.
  - `version.ts` — `NERIS_SPEC_VERSION` + a sha256 of the source spec.
- `scripts/checkSpec.ts` — fetches the live `openapi.yaml` and fails on hash drift. Wire into a
  **scheduled** CI job, not the PR job.
- Replace the "deliberately empty" README section with generation instructions.

**Tests** — golden test that regeneration produces no diff; unit tests asserting `LAWENFORCE`
exists, `BACKOUNTRY_RESCUE` does not, `MEDICAL||ILLNESS` parses at 2 levels, and NFIRS `300`
returns 54 candidates. Add a `test` script to the package so Turbo picks it up.

**Exit:** `pnpm --filter @pyra/neris test` green; `src/generated/` committed; `@pyra/import`
and `@pyra/db` can import real types.

---

### Phase 2 — Tenancy, roles, audit · ~2 weeks · *unblocked now*

The safety floor. **Must land before incidents** — retrofitting RLS onto a populated
`incidents` table with live pilots is a different and much worse project.

**Build**
- `pyra_app` non-owner role in a migration; grants; runtime connects as it. Update
  `deploy/docker-compose.yml`, `.env.example`, and the README env tables.
- `withTenant(departmentId, fn)` in `packages/db`; RLS + `FORCE` on domain tables.
- `packages/shared/src/roles.ts` — `admin | officer | member | readonly` and a
  `can(role, action)` matrix, unit-tested. Migration widens `users.role`; existing values stay valid.
- `audit_log` (department_id, actor_user_id, entity_type, entity_id, action, before/after jsonb, at).
  Written through one `recordAudit()` helper in the tRPC layer — **not** triggers, so it stays
  in TypeScript and stays testable. `pyra_app` gets `INSERT` and `SELECT` only.
- `tenantProcedure` in the router: `protectedProcedure` + department scope in ctx.

**Tests** — integration tests that prove PRD user story 7: department A cannot read department
B's rows, including when A forges B's id in the input. This is the test that lets us sell the
hosted tier to mutual-aid neighbours.

**Exit:** tenant-isolation integration tests green; ADR-0003 written.

---

### Phase 3 — Incident domain, local only · ~4 weeks · *unblocked now*

The core product. No network calls to NERIS in this phase.

**Build**
- Migration for `incidents` per ADR-0002, `incident_attachments`, `incident_submissions`.
- `packages/neris/src/rules/` — the hand-written conditionality layer over the generated
  schemas. One named function per rule with a stable code, returning
  `{ code, path, message, severity }[]` so the form renders inline errors and can distinguish
  *blocks submission* from *NERIS would accept it but it is thin*. Start with the rules we can
  read directly (§2.7): `neris_core` required set, `fire_detail` only if a `FIRE` type is
  present, `STRUCTURE_FIRE` requires the alarm + suppression modules unless all aids are
  `SUPPORT_AID` `GIVEN`, `UNDETERMINED` is CAD-only, `possible_if` gates on the medical /
  hazsit / rescue modules.
- tRPC `incidents` router: `create`, `get`, `list`, `update`, `softDelete`, `validate`.
- Web: progressive-disclosure form driven by `incident_types` — routine call is short, a
  structure fire expands. Routes `/app/incidents` and `/app/incidents/$incidentId`. Draft
  autosave via debounced mutation (the offline queue comes later, deliberately).
- Variable-depth type picker (§2.5).
- Seed a demo department with realistic incidents for development and screenshots.

**Tests** — heavy unit coverage on the rules layer (this is the PRD's "test pyramid weighted at
the NERIS validation layer"); integration tests on the router; a Playwright spec for the report
writer completing a routine call.

**Exit:** the PRD's Phase 1 criterion — a report writer completes a routine incident end to end
locally in **under 5 minutes on a phone viewport**. Measure it; do not assume it.

---

### Phase 4 — NERIS submission · ~3 weeks · **blocked on §3 A, B, C**

**Build**
- `packages/neris/src/client.ts` — `token()` via HTTP Basic + `client_credentials`, in-memory
  token cache with refresh-before-expiry, then `validateIncident`, `createIncident`,
  `putIncident`, `patchIncident`, `getIncident`, `listIncidents`, `getIncidentReport` (PDF),
  `putIncidentStatus`, `createNoActivityReport`.
- `department_neris_credentials` table: `client_id`, **encrypted** `client_secret`, entity
  NERIS ID, environment. Key from env — document key management and rotation
  (`POST /account/credential/{client_id}`) in the same PR.
- pg-boss queues `neris.submit` and `neris.poll`, registered in `apps/api/src/jobs/boss.ts`
  (currently a comment).
- Submission path: local rules → `POST /incident/{entity}/validate` → `POST /incident/{entity}`.
  `422 detail[].loc` joined with `.` → `apiErrorSchema.fieldErrors` (§2.8), surfaced inline on
  the exact field.
- Idempotency from the deterministic incident ID (§2.3): a duplicate create becomes a `PUT`.
- Amendment workflow via `PUT`, status via `PUT …/incident_status`, PDF via `GET …/report`.
- Monthly no-activity report — one button, one API call, one compliance obligation gone (§2.9).
- Chief-facing submission status view: draft / validated / submitted / accepted / rejected+reason.

**The differential validation harness — the highest-value thing in this plan.** A fixture
corpus (the §3-F real payloads plus synthetic edge cases) run through *both* our local rules
and the sandbox `/validate` endpoint, asserting they agree. A nightly CI job with sandbox
credentials as secrets fails when they diverge. This is how "≥95% accepted on first attempt"
becomes a property the build enforces rather than a metric we hope for — and it is how we catch
upstream rule changes before a pilot department does.

**Exit:** sandbox accepts a real submission; differential harness green; ADR-0004 written;
badge process underway (pending §3-G).

---

### Phase 5 — Importer · ~4 weeks · *unblocked; sharper with §3-F*

**Build**
- `import_runs` + `import_records` staging (raw jsonb, parse errors, mapped payload, per-record
  status). pg-boss `import.process`. Idempotent, resumable, dry-run.
- NFIRS 5.0 flat-file parser against the existing `Parser<TRecord>` interface — the
  pipe-delimited export set (`BASICINCIDENT`, `FIREINCIDENT`, `CIVILIANCASUALTY`, …) keyed by
  incident.
- **Mapping-review UI.** Because the crosswalk is ambiguous (§2.6), the importer surfaces the
  candidate set per NFIRS code, preselects a default by a documented heuristic (prefer the
  `OTHER_*` sibling inside the matched family), and persists the department's choices in
  `nfirs_type_mappings`. Confirmed once, applied to every subsequent run.
- `dispatch_code_mappings` for the CAD side, plus **export in NERIS's own
  `template__dispatch_code_to_incidenty_type.csv` format** so a department can upload the file
  NERIS asks for straight from Pyra. Small feature, disproportionate goodwill.
- Emergency Reporting CSV parser second — **blocked on a real sample export**; collect from
  pilots now, before departments purge.

**Exit:** one real department's full history imported with <1% unresolved records, and the
mapping decisions reviewable and re-runnable.

---

### Phase 6 — Offline, export, hardening · ~4 weeks

- Dexie draft queue + background sync. Late on purpose: sync bugs are expensive and the core
  must be stable first.
- One-click full export — JSON (canonical) + CSV (human) + attachments, streamed to S3/MinIO.
  Publish the format as a versioned spec (PRD 7, data sovereignty).
- Attachments via presigned S3 URLs. The env vars have existed since day one with no code behind them.
- TOTP 2FA via better-auth's `twoFactor()` plugin + magic link — the `TODO(phase-h)` markers.
- Automated backups + a **rehearsed** restore drill, documented.
- Rate limiting, ASVS L2 pass, dependency audit.
- Deploy docs tested by someone who has never seen the repo ("volunteer admin installs in <1 hr").

### Phase 7 — Pilot · ongoing

Per PRD Phase 5. Sequencing depends on §3-G: if the compatibility badge gates production entity
enrollment, pilots run on sandbox submissions until it lands.

---

## 6. Housekeeping backlog

Small, unblocked, and currently generating friction. Fold into whichever phase you touch next.

- Restore `CONTRIBUTING.md` (deleted, staged) or drop the README/CLAUDE.md references to it.
- Create `AGENTS.md` — `CLAUDE.md` links it as the home of engineering principles and it does not exist.
- Land or drop `apps/web/src/hero/` (untracked WebGL WIP) and the `biome.json` shader-ignore diff.
- Rename "Hydrant" → Pyra in `PYRA_PRD.md`.
- Docs pages are stubs; they are also a PRD non-negotiable ("no feature merges without deploy-docs updates").

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Upstream NERIS schema changes mid-build | Generation + pinned spec hash + scheduled drift check (Phase 1). The differential harness (Phase 4) catches semantic changes the hash cannot. |
| Hand-written rules layer drifts from real NERIS behaviour | It will. The differential harness is what makes that visible in a day instead of in a rejected pilot submission. Treat a harness failure as a build break. |
| Integration account cannot be self-created | If §3-A comes back "user account only, no integration permission", Phase 4 stalls at the helpdesk. Phases 1, 2, 3, and 5 all continue. |
| The bespoke generator becomes a tar pit | Explicit revisit trigger in ADR-0004: >600 lines or hand-patched output → switch to `openapi-zod-client`. |
| JSONB payloads make reporting painful later | Promote any field to a real column the moment we filter or join on it. Cheap, incremental, reversible. |
| Retrofitting RLS after incidents ship | Phase 2 before Phase 3, without exception. |
| Emergency Reporting samples unobtainable | Ask pilots for archived exports **now**. NFIRS flat-file alone still carries the historical-import story. |

---

## 8. Do this week

1. **Send me §3 A, B, C.** Three facts, and Phase 4 stops being hypothetical.
2. **Start Phase 1.** It needs nothing. It unblocks Phases 3, 4, and 5 simultaneously, and it is
   the difference between a scaffold and a product.
3. **Ask pilots for archived vendor exports** before departments purge them (PRD risk table,
   still true, more urgent every month).
4. **Ticket the NERIS helpdesk** for §3 G and H — those answers have long lead times and no
   engineering cost to wait on.
