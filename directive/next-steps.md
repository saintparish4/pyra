# Pyra — Next Steps

**As of:** 2026-09-23 · **Companion:** [`current-state.md`](./current-state.md)
**Derived from:** [`base/BUILD_PLAN.md`](../base/BUILD_PLAN.md) §5 and §8

The previous ten-step list is behind us: everything it named is written, committed, and green
in CI. What follows is what is actually left, in order.

Step 0 is half done. The half that remains is the half that needs a database.

---

## 0 · Put it on a database — *~1 hour*

**Done.** The static half ran on 2026-09-23 and is green in CI:

```bash
pnpm install                                  # lockfile committed in 42e8283
pnpm --filter @pyra/neris generate            # output committed in 6ca701f
pnpm --filter @pyra/db generate               # migration 0002 committed in be4e3eb
pnpm format && pnpm lint && pnpm typecheck && pnpm test
```

Four defects were sitting in code that had never been executed: the generator threw on
`format: uuid` and had produced no output at all, `withTenant` was `async` without an `await`,
about a hundred lines had never seen the formatter, and the lockfile had never been regenerated
— so CI could not get past `--frozen-lockfile`. The schemas.ts recursion worry was unfounded;
`LocationPayload`'s getters typecheck as written.

**Left.** Needs a Postgres. Nothing below this line has been observed even once:

```bash
docker compose -f deploy/docker-compose.yml up -d postgres
pnpm --filter @pyra/db migrate                # applies 0002_robust_wendell_rand
pnpm --filter @pyra/db harden                 # roles, grants, RLS. Idempotent
pnpm test:integration                         # .env.test already points at a *_test
                                              # database; create it if it is not there
pnpm test:e2e                                 # needs the app running
```

Expect friction in two places:

- **`sql/tenancy.sql`** runs as two `DO` blocks and has never executed. If `harden` fails it
  fails loudly and nothing is half-applied. It iterates `array['audit_log']`, so it has to run
  *after* migrate, not before.
- **`tenancy.integration.test.ts`** is the first real test of the RLS claim — that a caller for
  one department cannot read, update, or delete another's rows, and cannot rewrite the audit log
  at all. Its setup applies `tenancy.sql` to the test database, so a failure there is as likely
  to be the policy file as the test.

**Exit:** the tenancy suite green against a real Postgres. Until then ADR-0003 is a design, not
a guarantee, and `current-state.md` §2 describes code that typechecks rather than a database
that was observed refusing a cross-tenant read.

---

## 1 · Decide the hero experiment — *~30 minutes* · **needs you**

The one item on this page that is a taste judgement rather than engineering.

`apps/web/src/hero/` (WebGL colour field — `colorField.tsx`, `shader.ts`, two GLSL files) is
committed as of `fda5432` and **imported by nothing**. `home.tsx` only uses `hero-*` CSS class
names. It was six weeks of dirty `git status`; now it is dead code in `master`, which is quieter
and therefore easier to forget. Either wire it into `home.tsx`, or delete it.

**If you delete it**, three things go with it: the `*.glsl` / `*.vert` / `*.frag` entries in
`biome.json`, and the `*.vert?raw` / `*.frag?raw` declarations in `apps/web/src/vite-env.d.ts`.
The `!packages/neris/src/generated/**` ignore in the same `biome.json` list is unrelated and
must survive.

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
  workflow file is an invalid workflow, not an absent one: GitHub opens a run for each on every
  push and fails it in 0s. Two permanent red X's beside a green CI run, since `0b9db6c`. Write
  them or delete them — this is the cheapest item on this page.
- `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/bug.yml`, and
  `.github/ISSUE_TEMPLATE/feature.yml` are also 0 bytes. Harmless, but they advertise process
  that does not exist.
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
