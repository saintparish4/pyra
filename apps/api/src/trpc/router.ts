import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const healthRouter = router({
  check: publicProcedure.query(() => ({ ok: true })),
});

const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx.session;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };
  }),
});

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  // domain routers (departments, incidents, ...) mount here later
});

export type AppRouter = typeof appRouter;
