# Self-hosting Pyra

Production-shaped Docker Compose stack: Postgres, MinIO, the Pyra API, and an
Nginx container that serves the web app and proxies `/api/*` + `/trpc/*` to the
API on the same origin (no CORS).

## Quick start

```bash
cd deploy
cp .env.example .env
# edit .env: set BETTER_AUTH_SECRET (openssl rand -base64 32),
# SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD
docker compose up --build
```

Then open <http://localhost:8080> and sign in with the seeded admin.

If members reach the server by IP or hostname instead of localhost, set
`PYRA_ORIGIN` in `.env` accordingly (e.g. `http://192.168.1.50:8080`) —
auth cookies and CSRF checks are validated against it.

## What happens on `up`

1. `postgres` and `minio` start (data persisted in named volumes).
2. `migrate` (one-shot) applies drizzle migrations and seeds the department +
   admin user. Idempotent — safe on every `up`.
3. `api` starts once migration succeeds; health-checked on `/health`.
4. `web` (Nginx) starts once the API is healthy and serves on port 8080.

## Notes

- Postgres (5432) and the MinIO console (9001) are bound to `127.0.0.1` on the
  host for debugging only; containers talk over the compose network.
- Port conflict on the host? Override the host-side mapping in `.env`
  (`POSTGRES_PORT`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `WEB_PORT`) — e.g.
  `POSTGRES_PORT=5433` if you already run Postgres locally. Container-side
  ports (`postgres:5432`, `minio:9000`, api `3001`) never change. If you
  override `WEB_PORT`, update `PYRA_ORIGIN` to match.
- The job queue (pg-boss) lives inside Postgres — no extra service needed.
- TLS: put your usual reverse proxy (Caddy, Traefik, nginx) in front of port
  8080, and change `PYRA_ORIGIN` to the `https://` URL.
