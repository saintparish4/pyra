# @pyra/web

The browser app: React 19, Vite, TanStack Router + Query, the tRPC client, and
the better-auth client. Setup and the full command list live in the
[repository README](../../README.md).

```bash
pnpm --filter @pyra/web dev        # http://localhost:5173, expects the API on :3001
pnpm --filter @pyra/web build      # tsc -b && vite build
pnpm --filter @pyra/web test:e2e   # Playwright, boots the API and web dev servers
```

## Layout

| Path | Contents |
| --- | --- |
| `src/router.tsx` | Route tree; every page component is registered here |
| `src/routes/` | Page components (`home.tsx`, `login.tsx`, `appShell.tsx`, …) |
| `src/lib/trpc.ts` | tRPC client, typed from `@pyra/api`'s `AppRouter` |
| `src/lib/auth.ts` | better-auth client — the only other way to reach the server |
| `e2e/` | Playwright specs |

The server is reached through those two clients only; no component calls `fetch`
against an API route. Validation and shared types come from `@pyra/shared`.

Before the first E2E run, install the browser and seed a department:

```bash
pnpm --filter @pyra/web exec playwright install chromium
pnpm --filter @pyra/api seed
```
