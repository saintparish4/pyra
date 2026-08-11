# Build context is the repo root (see deploy/docker-compose.yml).
FROM node:22-alpine

RUN npm install -g pnpm@11.5.1
WORKDIR /app

# Manifests first so the dependency layer caches until a package.json or the
# lockfile changes. Every workspace manifest is needed for --frozen-lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/import/package.json packages/import/
COPY packages/neris/package.json packages/neris/
COPY packages/shared/package.json packages/shared/
COPY docs/package.json docs/
RUN pnpm install --frozen-lockfile --filter "@pyra/api..."

COPY . .

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/apps/api
# tsx directly (not via pnpm) so Node receives signals from Docker.
CMD ["node_modules/.bin/tsx", "src/index.ts"]
