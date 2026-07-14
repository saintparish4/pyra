import { initTRPC } from "@trpc/server";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const healthRouter = router({
  check: publicProcedure.query(() => ({ ok: true })),
});

export const appRouter = router({
  health: healthRouter,
  // domain routers (departments, incidents, ...) mount here later
});

export type AppRouter = typeof appRouter;
