# Pyra — Next Steps

**As of:** 2026-09-22 · **Companion:** [`current-state.md`](./current-state.md)
**Derived from:** [`base/BUILD_PLAN.md`](../base/BUILD_PLAN.md) §5 and §8

The previous ten-step list is mostly behind us. Steps 1, 3, 6, and 7 are written; steps 4 and 5
are written and need one command. What follows is what is actually left, in order.

Step 0 is not optional and comes before everything: **nothing here has been run.**

---

## 0 · Run it — *~1 hour*

In this order. The order matters: `@pyra/neris` has tests and typechecks that import
`src/generated/`, which does not exist until the generator runs.

```bash
pnpm install                                  # new deps: js-yaml, @types/js-yaml, tsx in two packages
pnpm --filter @pyra/neris generate            # writes packages/neris/src/generated/ — commit the output
pnpm --filter @pyra/db generate               # migration for audit_log
pnpm --filter @pyra/db migrate
pnpm --filter @pyra/db harden                 # roles, grants, RLS. Idempotent
pnpm format && pnpm lint && pnpm typecheck && pnpm test
pnpm test:integration                         # needs the _test database
```

Expect friction in three specific places, because they are the parts that could not be verified
without running them:

- **`packages/neris/src/generated/schemas.ts`** is ~550 zod declarations emitted in dependency
  order. `LocationPayload` and `LocationResponse` reference themselves, and the generator emits
  those two properties as getters — zod 4's documented recursive pattern. If TypeScript
  complains about a circular type annotation, that is where.
- **`sql/tenancy.sql`** runs as two `DO` blocks. If `harden` fails, it fails loudly and nothing
  is half-applied.
- **`pnpm test`** will fail before `generate` has run, with a missing-module error. That is
  expected, not a bug.

**Exit:** all four checks green, `src/generated/` committed.

---

## 1 · Decide the hero experiment — *~30 minutes* · **needs you**

The only item in the working tree that is genuinely a judgement call.

`apps/web/src/hero/` (WebGL colour field — `colorField.tsx`, `shader.ts`, two GLSL files) is
**imported by nothing**. `home.tsx` only uses `hero-*` CSS class names. Either wire it into
`home.tsx` and commit it, or delete it along with the `biome.json` shader ignore and the
`vite-env.d.ts` `?raw` declarations.

"Keep it uncommitted" is the one option that costs something — it has already cost six weeks of
a dirty `git status`.

**Careful:** `biome.json` now carries two unrelated changes. The `*.glsl` / `*.vert` / `*.frag`
ignore belongs to the hero work; `!packages/neris/src/generated/**` does not, and must survive.

---

## 2 · Send the three NERIS questions — *~30 minutes, then wait* · **needs you**

Unchanged, and now the only thing standing between Pyra and NERIS submission. From
`base/BUILD_PLAN.md` §3:

- **A** — do you hold a user account or an integration account? If user-only, can you reach
  `POST /account/integration/{entity_id}`? Capture the `client_secret` the moment it is
  returned; the API will not show it again.
- **B** — the entity NERIS ID (`FD` + 8 digits), and whether it is real or a test entity.
- **C** — confirm the credentials work against `https://api-test.neris.fsri.org/v1`, and get the
  production base URL. Do test and production entity IDs differ?

In the same sitting, because these have the longest lead times:

- Ticket the helpdesk for **G** (does an integration need certification before it can enroll
  production entities?) and **H** (rate limits and batch semantics — they size the pg-boss
  retry policy).
- Ask prospective pilot departments for archived vendor exports (**F**) *now*, before they
  purge them.

Item **D** answers itself once `.github/workflows/spec-drift.yml` runs: a 401 from
`{base}/openapi.yaml` means the spec endpoint is not public.

**Exit:** messages sent. Nothing below depends on the replies until step 6.

---

## 3 · The incident domain, server side — *~2 weeks* · **the critical path**

Phase 3 opens. No network calls to NERIS anywhere in steps 3 and 4.

- Migration for `incidents` per [ADR-0002](../adr/0002-incident-storage.md) — first-class
  columns for everything queried on (`id`, `department_id`, `incident_number`, `neris_id`,
  `status`, `source`, `occurred_at`, `primary_type`, `created_by`, `submitted_at`, `updated_at`,
  `deleted_at`) plus `payload jsonb` validated by `incidentPayloadSchema` on every write. GIN
  index on the payload. Also `incident_attachments` and `incident_submissions`.
- **Add the new tables to the array in `packages/db/sql/tenancy.sql`.** One line each. That is
  the whole cost of putting them behind RLS, and it is the cost that stays cheap only while the
  tables are empty.
- `packages/neris/src/rules/` — the hand-written conditionality layer. 205 fields are
  `neris_core`, 106 carry a `possible_if`, 33 a `neris_core_if`, all in inconsistent prose, and
  further rules live only in OpenAPI `description` strings. Generated schemas give shape;
  **conditionality has to be hand-written.** One named function per rule with a stable code,
  returning `{ code, path, message, severity }[]` so the form can distinguish *blocks
  submission* from *NERIS would accept this but it is thin*.

  Start with the ones that read directly out of `IncidentPayload.incident_types.description`:
  the `neris_core` required set; `fire_detail` only when a `FIRE` type is present;
  `STRUCTURE_FIRE` requiring the alarm + suppression modules unless all aids are `SUPPORT_AID`
  `GIVEN`; `CONFINED_COOKING_APPLIANCE_FIRE` requiring `cooking_fire_suppression`;
  `UNDETERMINED` being CAD-only.

  Severity must be `source`-aware ([ADR-0005](../adr/0005-imports-are-records.md)): a missing
  core field on an imported 1994 record is not an error; on a manual 2026 record it is.
- tRPC `incidents` router on `requirePermission(...)`: `create`, `get`, `list`, `update`,
  `softDelete`, `validate`. Every mutation calls `recordAudit()` inside the same `withTenant`
  transaction.

**Tests:** heavy unit coverage on the rules layer — this is where the PRD's pyramid is
deliberately heaviest. Integration tests on the router, following the pattern in
`tenancy.integration.test.ts`.

---

## 4 · The incident form — *~2 weeks*

- Progressive-disclosure form driven by incident type: a routine EMS call stays short, a
  structure fire expands. Routes `/app/incidents` and `/app/incidents/$incidentId`.
- Variable-depth type picker. **Do not assume three levels** — use `childrenOf()` from
  `@pyra/neris`. `LAWENFORCE` has one level, `MEDICAL||ILLNESS` two,
  `FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE` three.
- Offer only active values — `offerableValues()`. Retired types must still render on old
  records.
- Draft autosave via debounced mutation. The offline queue waits for Phase 6, deliberately.
- Seed a demo department with realistic incidents for development and screenshots.
- Playwright spec: a report writer completes a routine call.

**Exit — measure it, do not assume it:** a report writer completes a routine incident end to end
locally in **under 5 minutes on a phone viewport**. That is the PRD's Phase 1 criterion and the
first moment Pyra is a product.

---

## 5 · The importer — *~4 weeks* · *unblocked; sharper with §3-F*

Independent of the NERIS answers. Start it whenever step 4 is waiting on something.

- `import_runs` + `import_records` staging with `raw jsonb` preserved verbatim; pg-boss
  `import.process`, idempotent and resumable with a dry run. Register the queue in
  `apps/api/src/jobs/boss.ts`, which is still a comment.
- NFIRS 5.0 flat-file parser against the existing `Parser<TRecord>` interface.
- The **mapping-review UI** the ambiguous crosswalk forces: candidate set per NFIRS code from
  `nfirsCrosswalk`, a preselected default by documented heuristic, choices persisted in
  `nfirs_type_mappings` and applied to every later run. 161 of 164 codes are ambiguous; an
  importer that applies the crosswalk automatically will silently mis-type most of a
  department's history.
- Export in NERIS's own `template__dispatch_code_to_incidenty_type.csv` format, so a department
  can upload the file NERIS asks for straight from Pyra.

---

## 6 · NERIS submission — *~3 weeks* · **blocked on step 2's A, B, C**

- `packages/neris/src/client.ts` — `client_credentials` over HTTP Basic, in-memory token cache
  with refresh-before-expiry, then the incident verbs.
- `department_neris_credentials` with an **encrypted** `client_secret` and documented key
  rotation. Add the table to `sql/tenancy.sql`.
- pg-boss `neris.submit` and `neris.poll`.
- Submission path: local rules → `POST /incident/{entity}/validate` → `POST /incident/{entity}`,
  with `422 detail[].loc` joined on `.` mapping straight onto `apiErrorSchema.fieldErrors`.
- Idempotency for free from the deterministic incident ID, so a duplicate create becomes a
  `PUT`. One-click monthly no-activity report.

And the highest-value thing in the whole plan: **the differential validation harness.** A
fixture corpus run through both our local rules and the sandbox `/validate` endpoint, asserting
they agree, nightly. That is how "≥95% accepted on first attempt" becomes a property the build
enforces instead of a metric we hope for. Treat a harness failure as a build break.

---

## Housekeeping, unblocked, five minutes each

Small and currently generating friction. Fold into whichever step you touch next.

- `.github/workflows/deploy.yml` and `.github/workflows/security.yml` are **0 bytes**. An empty
  workflow file is an invalid workflow, not an absent one — GitHub reports it as failing. Write
  them or delete them.
- `.github/CODEOWNERS` and `.github/dependabot.yml` are also 0 bytes.
- `base/BUILD_PLAN.md` §1 and §6 now describe a repo that no longer exists, and §2's claim that
  `LAWENFORCE` is API-only is wrong — it is in the YAML. Annotate or supersede it; it is still
  the source of truth for §3–§5.
- `docs/docs/deploy.mdx`, `import.mdx`, and `intro.mdx` are still stubs. The PRD calls deploy
  docs a merge requirement.

---

## What is deliberately not in this list

Phase 6 and beyond, all real, all later: the Dexie offline queue and background sync (late on
purpose — sync bugs are expensive and the core has to be stable first), one-click full export,
S3 attachments, TOTP and magic link, rehearsed backup restore, rate limiting, and the ASVS L2
pass.

Two decisions stay open in `GOVERNANCE.md` until there is a reason to close them: the legal
entity, and offline sync conflict resolution. Neither blocks anything above.
