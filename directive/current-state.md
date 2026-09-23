# Pyra — Current State

**As of:** 2026-09-23 · **Branch:** `master` · **Verified at:** `c1cfbdf` — pushed, CI green
**Companion:** [`next-steps.md`](./next-steps.md) · **Source of truth for the plan:** [`base/BUILD_PLAN.md`](../base/BUILD_PLAN.md)

---

## 1. The one-line summary

The scaffold has a spine: the dictionary is generated, tenancy is enforced by the database, and
the decisions are written down. The incident model — the product itself — is still the hole in
the middle, and it is the next thing.

**What has run, and what has not.** The working tree is clean, all 17 commits are pushed, and
GitHub Actions is green on `c1cfbdf`: install, lint, format, typecheck, and 40 unit tests across
`@pyra/shared` and `@pyra/neris`. Nothing has touched a live Postgres. `migrate`, `harden`, the
two integration suites, and the two Playwright specs have never executed, so every claim below
about *what the database enforces* is a claim about code that typechecks, not about a database
that was observed refusing a cross-tenant read.

Running the generator was worth doing for its own sake: it had never produced output, because it
threw on `format: uuid` — 30 occurrences in the spec, reachable from `IncidentPayload`. Written
code that has not been executed is inventory, not progress.

---

## 2. What is built and working

| Area | State |
|---|---|
| Monorepo | pnpm 11.5.1 + Turborepo, Node 22, ESM-only, Biome 2, Husky pre-commit, CI (lint / format / typecheck / test) + a scheduled NERIS drift job. CI green in 48s |
| `apps/api` | Fastify 5 + tRPC 11 + better-auth. `/health`, `/api/auth/*`, `/trpc`. Routers: `health.check`, `auth.me`, `audit.list`. `tenantProcedure` + `requirePermission` + `recordAudit`. pg-boss starts and still registers **zero queues** |
| `apps/web` | React 19 + Vite, TanStack Router (manual tree) + Query, tRPC client, better-auth client. Marketing home, `/login`, `/app` shell, 5 stub pages. PWA precaches the shell only. **Untouched by this round of work** |
| `packages/db` | Drizzle + Postgres 16. 6 tables (`departments`, `users`, `sessions`, `accounts`, `verifications`, `audit_log`). 3 migrations, the third unapplied. RLS policies + grants in `sql/tenancy.sql`, applied by `harden` — **never yet run against a database** |
| `packages/shared` | Branded `DepartmentId` / `UserId`, sign-in + session DTOs, `apiErrorSchema`, and a 4-role × 10-permission `can()` matrix. 4 unit test files, 22 tests |
| `packages/neris` | A ~930-line generator over `NERIS/openapi.json` + the value-set YAML, and its 11,495-line output committed under `src/generated/`: ~550 zod schemas, 95 value sets, the NFIRS crosswalk, the spec version and digest. 3 test files, 18 tests, one of them the golden regeneration diff |
| `packages/import` | `Parser<TRecord>` interface + two empty parser folders. Unchanged |
| `packages/config` | Shared tsconfig presets (base + react). TypeScript pinned `~6.0.3` |
| `deploy` | Compose: Postgres, MinIO, one-shot migrate + **harden** + seed, API (as `pyra_app`), Nginx. Never brought up since the harden step was added |
| `docs` | Docusaurus. `adr`, `admin`, and `schema` pages describe what exists; `deploy`, `import`, `intro` are still stubs |
| ADRs | `0001` stack, `0002` incident storage, `0003` tenancy, `0004` generation, `0005` imports-are-records |

### What the generator reported

Kept here because it is the readable record of the gaps, and because these numbers are the
argument for the rules layer in step 3:

- **69 spec enums have no value-set YAML** and fall back to labelling by their own value.
- **13 values are in the API but not the YAML** — including `MEDICAL||ILLNESS`,
  `MEDICAL||INJURY`, and `RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE`.
- **2 are in the YAML but not the API** — one of them the upstream `BACKOUNTRY_RESCUE` typo.
- `binary` is the one OpenAPI string format left unhandled. It appears once, on the logo upload
  body, outside the roots we generate; it throws on purpose rather than widening to
  `z.string()`.

---

## 3. What is not built

| Gap | Consequence |
|---|---|
| **No incident model** | The product still does not exist. This is now the only thing between the scaffold and something a department can use |
| **Nothing has touched a database** | RLS, the audit log, and the tenancy integration suite are all unobserved. Cheap to fix — one `docker compose up` and three commands |
| **No rules layer** | `packages/neris/src/rules/` — the hand-written conditionality over the generated schemas — is where correctness actually lives, and it is empty |
| **No incident form** | Routes `/app/incidents` and `/app/incidents/$incidentId` do not exist |
| **No NERIS client** | Blocked on an integration credential, and only that |
| **No importer implementation** | The crowbar is still an interface and two comments. Fully unblocked |
| **No export, attachments, or offline queue** | Dexie and the S3 env vars remain installed and unused |
| **No TOTP / magic link** | `TODO(phase-h)` in `apps/api/src/auth/index.ts` and `apps/web/src/lib/auth.ts` |

---

## 4. Blockers — and what they actually block

Unchanged, and still narrow. From `base/BUILD_PLAN.md` §3:

- **A** — credential type: user account (`password` grant) or integration (`client_id` /
  `client_secret`, `client_credentials`). Pyra must run on the latter.
- **B** — entity NERIS ID (`FD` + 8 digits), real or test.
- **C** — environment + base URLs; confirm the sandbox, get the production URL.
- D, F, G, H — live spec, real accepted payloads, badge process, rate limits. All trailing.

**A, B, and C gate NERIS submission and nothing else.** The incident model, the rules layer,
the form, and the importer are all unblocked.

Item **D** now has a mechanism waiting for it: `.github/workflows/spec-drift.yml` fetches
`{base}/openapi.yaml` every Monday at 06:00 UTC and compares it against the committed
`NERIS_SPEC_VERSION` and digest. It has not fired yet. A 401 from that job is the answer to "is
the spec endpoint actually public"; anything else is a regeneration notice.

---

## 5. Decisions

All four are written. `adr/0002`–`0005` carry the argument, the cost stated plainly, and the
revisit trigger. `docs/docs/adr.mdx` indexes them.

Two decisions remain open and are tracked in `GOVERNANCE.md` rather than invented:

- The legal entity — nonprofit, cooperative, steward-ownership, or fiscal sponsorship — and
  with it, who holds the trademark, the domain, and the hosted infrastructure.
- Offline sync conflict resolution for the PWA draft queue.

One decision is open and **not** written down anywhere but here: whether `apps/web/src/hero/`
lives or dies. See `next-steps.md` §1.

---

## 6. What landed

17 commits, `0b9db6c..c1cfbdf`, working tree clean.

| Commits | What |
|---|---|
| `4a91d45` | `CONTRIBUTING.md`, `GOVERNANCE.md` — both were tracked and empty |
| `d3a47f2` | The 4-role × 10-permission `can()` matrix in `@pyra/shared` |
| `7189517`, `be4e3eb` | `audit_log` table and its migration |
| `e4e9d30`, `c05304a` | RLS tenancy: `sql/tenancy.sql`, `harden`, `withTenant()`, the `pyra_app` role, deploy and env wiring, ADR-0003 |
| `789927a` | `tenantProcedure`, `requirePermission`, the audit router, and the tenancy integration suite |
| `32435df`, `4ce8702`, `6ca701f` | The NERIS generator, the `uuid` / `email` fix that made it run, and its committed output |
| `9b1ce64`, `c1cfbdf`, `42e8283` | Biome ignores, formatting, and the lockfile CI needed |
| `fda5432` | `apps/web/src/hero/` — WebGL colour field, **still imported by nothing** |
| `064ef51`, `e706c6d`, `c340c9c` | ADR-0002 and 0005, the README and operator docs, and these directives |

---

## 7. Document map

`.gitignore` excludes `CLAUDE.md`, `AGENTS.md`, `PYRA_PRD.md`, `DESIGN.md`, and `NERIS/`.

| Document | Tracked | State |
|---|---|---|
| `README.md` | yes | Current. Setup, env tables (including `APP_DATABASE_URL` / `PYRA_APP_PASSWORD`), deployment |
| `CONTRIBUTING.md` | yes | Written. Process, what gets a change rejected, security reporting, licence |
| `GOVERNANCE.md` | yes | Written. Licence rationale, how decisions are made, and the entity question stated as open |
| `adr/0001`–`0005` | yes | Complete |
| `base/BUILD_PLAN.md` | yes | The plan. §1 and §6 are stale; §2–§8 stand |
| `directive/*.md` | yes | This file, `next-steps.md`, `roadmap.md` |
| `AGENTS.md` | no (ignored) | Written. Engineering principles, with an explicit order of authority |
| `CLAUDE.md` | no (ignored) | Current. Its link to `AGENTS.md` now resolves |
| `PYRA_PRD.md` | no (ignored) | Codename "Hydrant" replaced. Part 2's phase plan is still superseded by `base/BUILD_PLAN.md` |
| `DESIGN.md` | no (ignored) | Current |

**Known stale:** `base/BUILD_PLAN.md` §1 and §6 describe the repo as it was on 2026-08-30. §6's
housekeeping list is done except for the hero experiment. §2's claim that `LAWENFORCE` is
API-only is wrong — it is in the YAML; the three genuinely API-only values are
`MEDICAL||ILLNESS`, `MEDICAL||INJURY`, and `RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE`.

**Tracked and 0 bytes**, in increasing order of harm: `.github/CODEOWNERS`,
`.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/feature.yml`
— and `.github/workflows/deploy.yml` and `.github/workflows/security.yml`, which are *worse than
absent*: an empty workflow file is an invalid workflow, so GitHub fails both on every single
push. Two permanent red X's next to a green CI run.

---

## 8. Assessment

The safety floor is in and the dictionary is mechanised, so the expensive-to-reverse work is
behind us: RLS landed while `incidents` was still empty, which was the whole point of doing it
first.

The gap between "written" and "verified" was the most expensive thing in this round, and it is
now half closed. The static half is genuinely green. The database half is untested and will stay
that way until someone runs three commands against a real Postgres — which is the first item in
`next-steps.md`, and takes an hour, not a day.

What is left on the critical path is the product. The incident model, the rules layer, and the
form are roughly four weeks of the remaining work, and none of them touch NERIS's servers.
