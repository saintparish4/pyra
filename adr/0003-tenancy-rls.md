# ADR-0003: Tenancy — Postgres RLS behind a non-owner role

**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Saint (Bluesky Labs)

## Context

The hosted tier puts many departments on one Postgres instance, and the departments that share
it are frequently mutual-aid neighbours. PRD user story 7 states the requirement in the form it
will actually be asked in: *a chief must be able to be told, truthfully, that the department
next door cannot see their incidents.* ADR-0001 already calls row-level security "load-bearing"
for that tier.

Nothing enforces tenancy today. That is not a bug yet — there are no tenant-scoped queries to
enforce it on. It becomes one the moment `incidents` exists, and retrofitting RLS onto a
populated table with live pilots is a different and much worse project than enabling it on an
empty one.

The realistic alternative is application-level scoping: every query carries
`where department_id = ctx.departmentId`. It works right up until one query does not. The
failure is silent, it is a cross-tenant data leak, and no test catches the query that nobody
wrote a test for.

## Decision

**Defence in depth, with the database as the floor.**

### 1. A non-owner runtime role

Migrations run as the owning role (`pyra`). The API connects as **`pyra_app`**, which owns
nothing. This matters because Postgres exempts a table's owner from its own RLS policies unless
`FORCE ROW LEVEL SECURITY` is set — a non-owner runtime role means the policies apply even if
someone forgets `FORCE`.

`pyra_app` is created at database bootstrap, not in a migration: role creation needs privileges
the migration role should not require, and the password comes from the environment. Grants and
RLS hardening are applied by an idempotent `pnpm --filter @pyra/db harden` step that runs after
migrations, in the same one-shot job as `migrate` and `seed`.

**This changes `DATABASE_URL` semantics.** Migrations and runtime are no longer the same
connection string. `DATABASE_URL` is the owner (migrations, seed, tests); `APP_DATABASE_URL` is
`pyra_app` (the running API). `deploy/docker-compose.yml`, `.env.example`, and the README env
tables all carry both, and the API falls back to `DATABASE_URL` when `APP_DATABASE_URL` is unset
so a single-user self-host still works out of the box.

### 2. `ENABLE` + `FORCE ROW LEVEL SECURITY` on every domain table

Policies key on a session setting, not on a column the caller supplies:

```sql
create policy department_isolation on audit_log
  using (department_id = current_setting('app.department_id', true)::uuid)
  with check (department_id = current_setting('app.department_id', true)::uuid);
```

`with check` is not optional. Without it a tenant can `INSERT` or `UPDATE` a row *into* another
department; `using` alone only governs what they can read.

The `true` second argument to `current_setting` makes an unset variable return NULL rather than
raise. NULL fails the comparison, so an unscoped connection sees zero rows — fail closed.

### 3. `withTenant(departmentId, fn)`

Setting the variable is the one thing that must never be forgotten, so it is the one thing
callers cannot do by hand. `withTenant` in `@pyra/db` opens a transaction, issues
`SET LOCAL app.department_id`, and runs the callback inside it. `SET LOCAL` is scoped to the
transaction, so a pooled connection cannot leak one department's scope into the next request.

The department id is interpolated through a parameterised `set_config()` call, never string
concatenation — `SET LOCAL` does not accept bind parameters, and `set_config` does.

### 4. The carve-out, written down because it is what gets forgotten

**better-auth's Drizzle adapter queries `users`, `sessions`, `accounts`, and `verifications`
with no department in scope.** It looks a user up by email before any session exists — there is
no department id to set, because establishing which department the caller belongs to is the
*result* of that query, not an input to it. RLS on those four tables breaks sign-in.

So: **RLS covers domain tables. The four auth-owned tables are excluded**, and tenancy on them
is enforced in procedure code and proven by integration tests. Concretely, `tenantProcedure`
reads `departmentId` from the session row, never from procedure input, and any procedure that
accepts a department id in its input must reject one that does not match the session.

This is the weak seam. It is documented here so that the next person reading a `users` query
knows the database is not backing them up on that table.

## Consequences

**Positive**

- A missing `where department_id = …` is a query that returns nothing, not a data leak.
- The guarantee is demonstrable: an integration test connects as `pyra_app`, sets one
  department's scope, and proves the other department's rows are unreachable — including when
  the attacker forges the other department's id in the procedure input.
- Self-hosters running a single department are unaffected; the policies are satisfied trivially.

**Negative / accepted risks**

- Two connection strings to keep straight. Mitigated by the fallback and by the env tables.
- Any query that legitimately spans departments (cross-department analytics, support tooling)
  must run as the owner, deliberately and visibly.
- `SET LOCAL` requires a transaction, so every tenant-scoped read is wrapped in one. At fire
  department volumes this is free; it is noted so nobody is surprised by it in a trace.
- The auth-table carve-out means part of the tenancy story is enforced only by tests. It is the
  first thing to revisit if better-auth ever exposes a scoped adapter hook.

## Revisit triggers

- better-auth gains a way to scope adapter queries → close the carve-out and put RLS on the
  auth tables too.
- A legitimate cross-department feature appears (mutual-aid shared incidents) → design it as an
  explicit policy, not as a hole in the existing one.
- Connection pooling moves to a transaction-pooling proxy that breaks `SET LOCAL` semantics →
  re-evaluate the mechanism, not the boundary.
