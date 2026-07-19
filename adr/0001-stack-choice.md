# ADR-0001: Stack choice

**Status:** Accepted
**Date:** 2026-07-18
**Deciders:** Saint (Bluesky Labs)

## Context

Pyra is a free, open-source (AGPL-3.0), self-hostable records management system for US fire
departments, built around the January 2026 NFIRS→NERIS transition. The constraints that drive
every technology choice:

1. **Solo-founder velocity.** One person builds the MVP; every stack decision must minimize
   glue code and context-switching.
2. **Contributor accessibility.** The long-term moat is community governance, so the stack
   should be one an average open-source TypeScript contributor can pick up.
3. **Self-hosting by a semi-technical volunteer.** Definition of done is "deployable via
   Docker Compose in under an hour by the one member who does computers." Every additional
   service in the compose file is a support burden.
4. **Offline-capable PWA.** Report writers start incident reports at the station or at home
   with spotty connectivity; drafts must queue and sync.
5. **Multi-tenant hosted tier.** The co-op tier hosts many departments on one instance, with
   hard data isolation between departments.

## Decision

TypeScript end-to-end in a pnpm + Turborepo monorepo, with:

### Frontend: React + Vite (PWA)

Vite over Next.js because we have no SSR requirement — the app is an authenticated tool, not a
content site — and a static bundle behind any web server is the simplest thing a volunteer can
self-host. TanStack Router/Query pair with tRPC for typed data flow. The PWA/offline layer
(service worker + IndexedDB) attaches to a Vite SPA without fighting a server-rendering
framework. Revisit only if a public-facing, SEO-relevant surface appears (explicitly a
non-goal for MVP).

### API: Fastify + tRPC

tRPC gives end-to-end type safety between API and web app with zero codegen — the single
biggest velocity win for a solo TypeScript developer. Fastify is a fast, stable Node server
with a mature plugin ecosystem (CORS, later rate-limiting/websockets). REST+OpenAPI was
considered and deferred: third-party integrations will eventually want it, so we plan to
publish an OpenAPI surface for the ecosystem later, but internal traffic stays tRPC.

### Database: PostgreSQL 16 + Drizzle ORM

Postgres is the boring, correct choice and the community default for self-hosting. Two
features are load-bearing:

- **Row-level security** for department-per-tenant isolation in the hosted tier (user story:
  mutual-aid neighbors on one instance must never see each other's data).
- **JSONB** for legacy-import payloads (imported records that don't map 1:1 to NERIS are
  preserved verbatim and searchable) and for flexibility across NERIS schema versions.

Drizzle over Prisma because it is SQL-first (RLS policies and migrations stay visible and
reviewable as SQL), has no binary engine to complicate Docker images, and generates plain
migrations that a contributor can read.

### Jobs/queue: pg-boss

NERIS submission retries and import processing need a durable job queue. pg-boss runs the
queue inside Postgres — one less service (no Redis) in the compose file, which directly serves
constraint 3. Queue throughput requirements are modest (a department submits dozens of
incidents a day, not thousands a second), so Postgres-backed queuing is comfortably within
capacity. Revisit if a hosted instance's queue volume ever contends with OLTP traffic.

### Object storage: MinIO (S3-compatible)

Attachments (photos, documents) go to S3-compatible object storage. Self-hosters get MinIO
bundled in Docker Compose; the hosted tier points the same client at S3/R2. Coding against
the S3 API keeps one code path for both deployment modes.

### Auth: better-auth

The PRD shortlisted Lucia or better-auth. Lucia's maintainer deprecated it as a library
(archived to a learning resource), which rules it out for a project that must outlive vendor
churn. better-auth is actively maintained, TypeScript-native, ships email+password plus the
TOTP 2FA and magic-link plugins we need for low-tech members, and integrates with Drizzle
via its adapter. Session cookies flow through tRPC context into `protectedProcedure`.

## Consequences

**Positive**

- One language, one type system, one lockfile: schema types flow from Drizzle → tRPC → React.
- The self-host footprint is exactly three containers: app, Postgres, MinIO.
- Every piece is mainstream TypeScript OSS — contributors need no exotic knowledge.

**Negative / accepted risks**

- tRPC couples the web client to the API; external integrators must wait for the OpenAPI
  surface.
- pg-boss ties job throughput to the primary database; acceptable at fire-department scale,
  monitored in the hosted tier.
- better-auth is younger than the auth incumbents; mitigated by its Drizzle-backed schema —
  sessions and accounts live in our own Postgres tables, so migrating off is a data-preserving
  refactor, not a data migration.
- No SSR means no server-rendered public pages; fine while public surfaces remain a non-goal.

## Revisit triggers

- A public, SEO-relevant surface becomes a goal → reconsider Next.js (or a separate site).
- Third-party integration demand → publish REST/OpenAPI alongside tRPC.
- Hosted-tier queue volume contends with OLTP → move jobs to a dedicated queue.
