# Contributing to Pyra

Pyra is a records management system for US fire departments. The people who run it are
volunteers, and the people who use it are writing reports after a bad night. That shapes what a
good contribution looks like here more than any style rule does.

Start with [`README.md`](./README.md) for setup. This file covers process: how work gets picked
up, what a reviewable change looks like, and the few rules that are not negotiable.

---

## Before you write code

**Open an issue, or pick one up, before anything large.** A fifteen-minute conversation about
the approach is cheaper than a rewritten PR. Small fixes — a typo, a broken link, an obviously
wrong condition — do not need one.

Two things are worth checking first:

- **Is it blocked on the NERIS dictionary?** Incident fields, value sets, and submission
  behaviour come from the official dictionary in `packages/neris`. See "Never guess the domain"
  below.
- **Does it add a dependency or a service?** Check what is already installed. Every container in
  the compose file is something a volunteer admin has to keep running.

## Setting up

```bash
pnpm install
cp .env.example .env         # set BETTER_AUTH_SECRET at minimum
pnpm --filter @pyra/db migrate
pnpm --filter @pyra/api seed
pnpm dev                     # web on :5173, API on :3001
```

Integration tests need a separate Postgres database whose name ends in `_test`; the suite
refuses to run against anything else, because it truncates every table between cases. Put its
URL in `.env.test`.

## Making a change

1. **Branch from `master`.** Keep the branch scoped to one thing.
2. **Respect the module boundaries.** `apps/*` are applications, `packages/*` are libraries. A
   change that spans both usually means the contract belongs in `packages/shared`. Only
   `packages/db` and `apps/api` touch Postgres; the web app reaches the server only through the
   tRPC client and the better-auth client.
3. **Write the test that documents the behaviour.** New business logic — validators, ID helpers,
   import parsers, permission checks — needs Vitest coverage. Name the test after what it
   guarantees: `rejects a department id from another tenant`, not `test authz 3`.
4. **Run the checks before you push:**

   ```bash
   pnpm format && pnpm lint && pnpm typecheck && pnpm test
   ```

   The pre-commit hook and CI run the same four. If you touched the API and a database is
   available, run `pnpm test:integration` too.
5. **Fill in the PR template.** "How was this tested" is the section reviewers read first.

## What gets a change rejected

These are not style preferences. Each one has cost real time somewhere:

- **Guessed NERIS fields.** If a field, value, or constraint is not in the official dictionary,
  it does not go in. A field invented today is a field un-invented later, and the importer, the
  database, and the form all carry the mistake. When the dictionary is ambiguous, encode the
  ambiguity explicitly — a named rule with a stable code — rather than picking an answer.
- **A backward-compatibility layer.** Pyra has no installed base to protect. When you replace
  something, delete the thing you replaced in the same change. Git remembers it.
- **`any`, non-null assertions (`!`), or `@ts-ignore`.** These are lint errors. Fix the type.
- **Business logic in a React component.** Components render and wire hooks. Validation, IDs,
  and domain rules live in `packages/shared`; request handling in `apps/api/src/trpc`;
  persistence in `packages/db`.
- **A mocked database in an integration test.** A mocked Drizzle proves the mock works. Use a
  real Postgres.
- **Schema changes without a migration.** Edit `packages/db/src/schema/`, run
  `pnpm --filter @pyra/db generate`, then `migrate`. Never hand-edit an applied SQL file.
- **Hand-edited generated code.** `packages/neris/src/generated/` is produced by
  `pnpm --filter @pyra/neris generate`. A golden test fails if the committed output and a fresh
  regeneration disagree. Change the generator, not its output.
- **Comments that restate the code.** Comments explain *why* — a constraint, an invariant, a
  workaround, a surprising behaviour. Not what the line does. When reviewing generated or
  AI-assisted code, delete the decorative comments rather than keeping them because they look
  thorough.

## Code style

[Biome](https://biomejs.dev) is the formatter and the linter: tabs, double quotes, semicolons,
organised imports. **Do not reintroduce ESLint or Prettier**, and do not add a parallel style
config. Compiler options come from `packages/config` — extend a preset rather than loosening
strictness in a leaf `tsconfig.json`.

A few conventions the linter cannot check:

- Named exports, not default exports. Route components are `export function Home()`.
- Files are camelCase (`appShell.tsx`, `ids.test.ts`). Folders are lowercase, snake_case when
  more than one word (`job_queue/`, not `jobQueue/` or `job-queue/`). React components stay
  PascalCase in the *export*, not the filename.
- Relative imports inside a package carry the `.js` extension (`export * from "./ids.js"`) —
  NodeNext resolution. Cross-package imports use the workspace name (`@pyra/shared`).
- Branded IDs from `packages/shared` instead of a bare `string`.

## Documentation

Three places, three audiences:

| Where | For | Example |
| --- | --- | --- |
| `docs/` | Operators and admins | How to restore a backup |
| `adr/` | Future contributors | Why tenancy is RLS and not a `where` clause |
| Tests | The next person to touch this code | What the function guarantees |

Fold the docs page into the change that needs it. A documentation sprint scheduled for later
does not happen, and the PRD treats deploy docs as a merge requirement, not a follow-up.

**Architecture Decision Records** are for choices that are expensive to reverse, that constrain
later choices, or that will be re-litigated by someone who was not there. Library picks usually
do not qualify; anything that shapes the deployment footprint, the data model, or the tenancy
boundary does. Every ADR carries a **revisit trigger** — the specific condition that would
reopen it. Number sequentially, never renumber, never delete; a superseded record gets its
status changed and a pointer to its replacement.

## Reporting a security issue

**Do not open a public issue.** Pyra holds incident records, personal medical details of
patients, and firefighter casualty data. Email the maintainer directly and allow time for a fix
before disclosure. Tenancy bugs — anything where one department can observe another's data —
are treated as the highest severity in the project.

## Licence

Pyra is [AGPL-3.0-only](./LICENSE). Contributions are accepted under the same licence. The
copyleft is deliberate: a department that self-hosts Pyra should never discover that the version
they depend on has been closed behind someone else's paywall. See
[`GOVERNANCE.md`](./GOVERNANCE.md) for how that intention is meant to outlast any one
maintainer.

## Where to ask

Issues: https://github.com/saintparish4/pyra/issues

If you are a firefighter, an officer, or the person who does computers for a department — bug
reports about how the software actually behaves at 3am are worth more to this project than most
patches. Please open them.
