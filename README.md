# Pyra

Self-hostable records management system for US fire departments. TypeScript monorepo (pnpm + Turborepo). Auth, department tenancy, the app shell, and the Docker Compose stack run today. Incident reporting, NERIS types, and the importer target schema are blocked on the official NERIS data dictionary — do not invent those fields.

## Requirements

- Node.js 22 (CI pins this; `docs` also accepts >= 20)
- [pnpm 11.5.1](https://pnpm.io/installation) — exact version is in `packageManager`
- Docker (Postgres 16 + MinIO for local services, or the full self-host stack)
- Git

## Installation

```bash
git clone https://github.com/saintparish4/pyra.git
cd pyra
pnpm install
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Bring up Postgres and MinIO if you do not already have them:

```bash
docker compose -f deploy/docker-compose.yml up postgres minio -d
```

Apply migrations and seed a department + admin:

```bash
pnpm --filter @pyra/db migrate
pnpm --filter @pyra/api seed
```

Seed defaults (dev only): `admin@pyra.local` / `pyra-dev-admin`. The seed script refuses the well-known password when `NODE_ENV=production` unless `SEED_ADMIN_PASSWORD` is set.

`pnpm install` also installs Husky. The pre-commit hook runs lint, format check, typecheck, and tests.

## Development

```bash
pnpm dev
```

| Process | URL |
|---|---|
| Web (`@pyra/web`) | http://localhost:5173 |
| API (`@pyra/api`) | http://localhost:3001 |
| API health | http://localhost:3001/health |
| MinIO console | http://localhost:9001 |

Useful commands:

```bash
pnpm --filter @pyra/api dev          # API only
pnpm --filter @pyra/web dev          # web only
pnpm --filter @pyra/docs start       # Docusaurus on :3000
pnpm --filter @pyra/db generate      # drizzle-kit generate (after schema edits)
pnpm --filter @pyra/db migrate       # apply migrations
pnpm --filter @pyra/db studio        # Drizzle Studio
pnpm --filter @pyra/api seed         # idempotent; skips if the admin email exists
```

Schema changes live in `packages/db/src/schema/`. Generate a migration, then apply it — do not hand-edit applied SQL without a new migration.

Work on `packages/neris` only after cloning [`ulfsri/neris-framework`](https://github.com/ulfsri/neris-framework) to `NERIS/` at the repo root. That path is gitignored.

## Testing

```bash
pnpm lint              # Biome lint
pnpm format            # Biome format (write)
pnpm format:check      # Biome format (CI / pre-commit)
pnpm typecheck
pnpm test              # Vitest unit tests across workspaces
pnpm test:integration  # Vitest against a real Postgres (apps/api)
pnpm test:e2e          # Playwright (apps/web)
```

CI (`.github/workflows/ci.yml`) runs `lint`, `format:check`, `typecheck`, and `test` on every push to `master` and every PR — the same set the pre-commit hook runs.

Three layers, three tools:

| Layer | Tool | Lives in | Command |
|---|---|---|---|
| Unit | Vitest | beside the code it covers (`src/ids.test.ts`) | `pnpm test` |
| Integration | Vitest + real Postgres | `apps/api/src/**/*.integration.test.ts` | `pnpm test:integration` |
| End-to-end | Playwright | `apps/web/e2e/` | `pnpm test:e2e` |

Run one package: `pnpm --filter @pyra/shared test`.

### Integration tests

They drive Fastify + tRPC + Drizzle against a real database and truncate every table between cases, so they refuse to start unless `DATABASE_URL` names a database ending in `_test`:

```bash
docker compose -f deploy/docker-compose.yml exec postgres createdb -U pyra pyra_test
printf 'DATABASE_URL=postgresql://pyra:pyra@localhost:5432/pyra_test\n' > .env.test
pnpm test:integration
```

`.env.test` is layered over `.env` and wins where both set a key, so it only has to carry `DATABASE_URL`; everything else (`BETTER_AUTH_SECRET`, …) still comes from `.env`. Migrations are applied in setup.

### End-to-end tests

Playwright starts the API and web dev servers itself, but Postgres has to be up and seeded first:

```bash
pnpm --filter @pyra/web exec playwright install chromium
pnpm --filter @pyra/api seed
pnpm test:e2e
```

## Environment Variables

Root `.env` is loaded by the API and by Drizzle (`packages/db/drizzle.config.ts`). Copy from `.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `BETTER_AUTH_SECRET` | yes | Session signing secret (>= 32 chars) |
| `BETTER_AUTH_URL` | yes | Auth base URL (dev: `http://localhost:3001`) |
| `WEB_ORIGIN` | yes | CORS + cookie origin (dev: `http://localhost:5173`) |
| `PORT` | no | API port (default `3001`) |
| `S3_ENDPOINT` | yes | Object store (dev: MinIO `http://localhost:9000`) |
| `S3_ACCESS_KEY` | yes | Object store access key |
| `S3_SECRET_KEY` | yes | Object store secret key |
| `S3_BUCKET` | yes | Bucket name (default `pyra`) |
| `SEED_ADMIN_NAME` | no | Seeded admin name (default `Admin`) |
| `SEED_ADMIN_EMAIL` | no | Seeded admin email (default `admin@pyra.local`) |
| `SEED_ADMIN_PASSWORD` | prod | Required in production; defaults to `pyra-dev-admin` in development |

Web (`apps/web/.env`):

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | yes | API origin the browser calls (dev: `http://localhost:3001`) |

Tests (`.env.test` at the repo root, plus the shell for Playwright):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Integration-test database; the name must end in `_test` |
| `E2E_ADMIN_EMAIL` | no | Playwright sign-in email (default `admin@pyra.local`) |
| `E2E_ADMIN_PASSWORD` | no | Playwright sign-in password (default `pyra-dev-admin`) |
| `E2E_WEB_ORIGIN` | no | Web app under test (default `http://localhost:5173`) |
| `E2E_API_ORIGIN` | no | API under test (default `http://localhost:3001`) |

Self-host (`deploy/.env` — see [Deployment](#deployment)):

| Variable | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | yes | Generate with `openssl rand -base64 32` |
| `SEED_ADMIN_PASSWORD` | yes | First admin password |
| `SEED_ADMIN_NAME` | no | First admin name |
| `SEED_ADMIN_EMAIL` | no | First admin email |
| `PYRA_ORIGIN` | yes | Public URL users open (must match cookies/CSRF) |
| `WEB_PORT` / `POSTGRES_PORT` / `MINIO_PORT` / `MINIO_CONSOLE_PORT` | no | Host-side port overrides |

Do not commit `.env` files.

## Architecture

End-to-end TypeScript. Stack rationale: [ADR-0001](./adr/0001-stack-choice.md).

```
apps/web  (React + Vite PWA, TanStack Router/Query, tRPC client, better-auth)
    │  /api/auth/*  and  /trpc/*
    ▼
apps/api  (Fastify + tRPC + better-auth + pg-boss)
    ├── packages/db      Postgres 16 via Drizzle
    ├── packages/shared  zod DTOs, branded tenant IDs
    └── MinIO            S3-compatible attachments
```

| Path | Role |
|---|---|
| `apps/api` | Fastify server: `/health`, `/api/auth/*`, `/trpc`, job queue |
| `apps/web` | SPA + PWA app-shell precaching; login and stub routes |
| `packages/db` | Drizzle schema, migrations, Postgres client |
| `packages/shared` | Shared validators between web and API |
| `packages/neris` | NERIS types — empty until the dictionary lands |
| `packages/import` | Legacy-import parsers — `Parser` interface only |
| `packages/config` | Shared tsconfig presets (`tsconfig.base.json`, `tsconfig.react.json`) |
| `deploy` | Docker Compose: Postgres, MinIO, migrate+seed, API, Nginx |
| `docs` | Docusaurus (Deploy / Admin / Import / Schema / ADR — mostly stubs) |
| `adr` | Architecture decision records |

Request flow in development: browser on `:5173` talks cross-origin to `:3001` (CORS + credentials). In Compose, Nginx serves the SPA and proxies `/api/*` and `/trpc/*` on one origin — no CORS.

Auth is provisioned, not self-serve. Accounts are created by seed (or later, admin). Sessions live in Postgres via better-auth's Drizzle adapter. Jobs (NERIS retries, imports) use pg-boss in the same Postgres — no Redis.

Do not model NERIS entities or incident fields until the official dictionary is in `packages/neris`. The importer maps vendor rows onto that schema; building a guessed target means rewriting both.

## Deployment

Self-host with Docker Compose. Full notes: [`deploy/README.md`](./deploy/README.md).

```bash
cd deploy
cp .env.example .env
# set BETTER_AUTH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
# set PYRA_ORIGIN to the URL users actually open
docker compose up --build
```

Open http://localhost:8080 and sign in with the seeded admin.

On `up`: Postgres and MinIO start (named volumes), a one-shot `migrate` container applies Drizzle migrations and seeds the admin, then the API comes up (`/health`). Nginx starts once the API is healthy.

TLS: put Caddy / Traefik / nginx in front of port 8080 and set `PYRA_ORIGIN` to the `https://` URL. If members reach the host by IP, `PYRA_ORIGIN` must be that URL (e.g. `http://192.168.1.50:8080`).

## Contributing

1. Open an issue or pick one before large work.
2. Branch from `master`.
3. Keep changes scoped. Match existing module boundaries (`apps/*` vs `packages/*`).
4. Run `pnpm format && pnpm lint && pnpm typecheck && pnpm test` before you push. Pre-commit and CI will reject otherwise.
5. Do not add a compatibility layer for removed code. Do not guess NERIS fields.

Biome is the linter and formatter (tabs). Do not reintroduce ESLint or Prettier.

External docs for operators live in `docs/`. Stack decisions go in `adr/`. Process notes belong in [`CONTRIBUTING.md`](./CONTRIBUTING.md) when that file is filled in.

Issues: https://github.com/saintparish4/pyra/issues

## License

[AGPL-3.0](./LICENSE)
