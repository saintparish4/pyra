# Build context is the repo root (see deploy/docker-compose.yml).
FROM node:22-alpine AS build

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
COPY packages/shared/package.json packages/shared/
COPY docs/package.json docs/
RUN pnpm install --frozen-lockfile --filter "@pyra/web..."

COPY . .

# Same-origin deployment: nginx proxies /api/* and /trpc/* to the api
# container, so the client uses relative URLs (empty VITE_API_URL).
ENV VITE_API_URL=""
RUN pnpm --filter @pyra/web build

FROM nginx:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
