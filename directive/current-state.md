# Pyra — Current State

**As of:** 2026-09-22 · **Branch:** `master` · **HEAD:** `0b9db6c` (2026-08-11)
**Companion:** [`next-steps.md`](./next-steps.md) · **Source of truth for the plan:** [`base/BUILD_PLAN.md`](../base/BUILD_PLAN.md)

---

## 1. The one-line summary

The scaffold now has a spine: the dictionary is generated, tenancy is enforced by the database,
and the decisions are written down. The incident model — the product itself — is still the hole
in the middle, and it is the next thing.

**Nothing in this working tree has been run.** Every command below is the user's to execute;
until `pnpm install && pnpm --filter @pyra/neris generate && pnpm test` passes, treat this
document as describing code that is written, not code that is verified.

---

## 2. What is built and working

| Area | State |
|---|---|
| Monorepo | pnpm 11.5.1 + Turborepo, Node 22, ESM-only, Biome 2, Husky pre-commit, CI (lint / format / typecheck / test) + a scheduled NERIS drift job |
| `apps/api` | Fastify 5 + tRPC 11 + better-auth. `/health`, `/api/auth/*`, `/trpc`. Routers: `health.check`, `auth.me`, `audit.list`. `tenantProcedure` + `requirePermission` + `recordAudit`. pg-boss starts and still registers **zero queues** |
| `apps/web` | React 19 + Vite, TanStack Router (manual tree) + Query, tRPC client, better-auth client. Marketing home, `/login`, `/app` shell, 5 stub pages. PWA precaches the shell only. **Untouched by this round of work** |
| `packages/db` | Drizzle + Postgres 16. 6 tables (`departments`, `users`, `sessions`, `accounts`, `verifications`, `audit_log`). RLS policies + grants in `sql/tenancy.sql`, applied by `harden`. `withTenant()` |
| `packages/shared` | Branded `DepartmentId` / `UserId`, sign-in + session DTOs, `apiErrorSchema`, and a 4-role × 10-permission `can()` matrix. 4 unit test files |
| `packages/neris` | A 678-line generator over `NERIS/openapi.json` + the value-set YAML, emitting `src/generated/`. **The output is not on disk yet — it needs one `generate` run** |
| `packages/import` | `Parser<TRecord>` interface + two empty parser folders. Unchanged |
| `packages/config` | Shared tsconfig presets (base + react). TypeScript pinned `~6.0.3` |
| `deploy` | Compose: Postgres, MinIO, one-shot migrate + **harden** + seed, API (as `pyra_app`), Nginx |
| `docs` | Docusaurus. `adr`, `admin`, and `schema` pages now describe what exists; `deploy`, `import`, `intro` are still stubs |
| ADRs | `0001` stack, `0002` incident storage, `0003` tenancy, `0004` generation, `0005` imports-are-records |

---

## 3. What is not built

| Gap | Consequence |
|---|---|
| **No incident model** | The product still does not exist. This is now the only thing between the scaffold and something a department can use |
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
`{base}/openapi.yaml` on a schedule. A 401 from that job is the answer to "is the spec endpoint
actually public".

---

## 5. Decisions

All four are written. `adr/0002`–`0005` carry the argument, the cost stated plainly, and the
revisit trigger. `docs/docs/adr.mdx` indexes them.

Two decisions remain open and are tracked in `GOVERNANCE.md` rather than invented:

- The legal entity — nonprofit, cooperative, steward-ownership, or fiscal sponsorship — and
  with it, who holds the trademark, the domain, and the hosted infrastructure.
- Offline sync conflict resolution for the PWA draft queue.

---

## 6. Working tree

| Path | State | Note |
|---|---|---|
| `apps/web/src/hero/` | untracked | WebGL colour-field WIP. **Still imported by nothing.** The one item in this repo that genuinely needs a decision |
| `biome.json` | modified | The `*.glsl` / `*.vert` / `*.frag` ignore belongs to the hero WIP; the `packages/neris/src/generated/**` ignore does not. **Do not revert the whole file if the hero work is dropped** |
| `apps/web/src/vite-env.d.ts` | modified | `*.vert?raw` / `*.frag?raw` declarations — hero WIP only |
| everything else | modified / untracked | This round of work. See `next-steps.md` for the commit split |

`CONTRIBUTING.md` and `GOVERNANCE.md` were tracked but empty; both now have content, so the
staged deletion of `CONTRIBUTING.md` should be dropped rather than completed.

---

## 7. Document map

`.gitignore` excludes `CLAUDE.md`, `AGENTS.md`, `PYRA_PRD.md`, `DESIGN.md`, and `NERIS/`.

| Document | Tracked | State |
|---|---|---|
| `README.md` | yes | Current. Setup, env tables (now including `APP_DATABASE_URL` / `PYRA_APP_PASSWORD`), deployment |
| `CONTRIBUTING.md` | yes | Written. Process, what gets a change rejected, security reporting, licence |
| `GOVERNANCE.md` | yes | Written. Licence rationale, how decisions are made, and the entity question stated as open |
| `adr/0001`–`0005` | yes | Complete |
| `AGENTS.md` | no (ignored) | Written. Engineering principles, with an explicit order of authority |
| `CLAUDE.md` | no (ignored) | Current. Its link to `AGENTS.md` now resolves |
| `PYRA_PRD.md` | no (ignored) | Codename "Hydrant" replaced. Part 2's phase plan is still superseded by `base/BUILD_PLAN.md` |
| `DESIGN.md` | no (ignored) | Current |
| `base/BUILD_PLAN.md` | no (untracked) | The plan. §1's assessment is now out of date in Pyra's favour; §2–§8 stand |

**Known stale:** `base/BUILD_PLAN.md` §1 and §6 describe the repo as it was on 2026-08-30. §6's
housekeeping list is done except for the hero experiment. §2's claim that `LAWENFORCE` is
API-only is wrong — it is in the YAML; the three genuinely API-only values are
`MEDICAL||ILLNESS`, `MEDICAL||INJURY`, and `RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE`.

Two other tracked files are 0 bytes and will fail or do nothing:
`.github/workflows/deploy.yml`, `.github/workflows/security.yml` — an empty workflow file is an
invalid workflow, not an absent one — plus `.github/CODEOWNERS` and `.github/dependabot.yml`.

---

## 8. Assessment

The safety floor is in and the dictionary is mechanised, so the expensive-to-reverse work is
behind us: RLS landed while `incidents` was still empty, which was the whole point of doing it
first.

What is left on the critical path is the product. The incident model, the rules layer, and the
form are roughly four weeks of the remaining work, and none of them touch NERIS's servers.
