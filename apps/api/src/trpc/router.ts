import { sessionUserSchema } from "@pyra/shared";

import { auditRouter } from "./audit.js";
import { protectedProcedure, publicProcedure, router } from "./procedures.js";

const healthRouter = router({
	check: publicProcedure.query(() => ({ ok: true })),
});

const authRouter = router({
	me: protectedProcedure.query(({ ctx }) => {
		const { user } = ctx.session;
		// Parsed through the shared schema, so a role or department id the
		// contract does not recognise fails here and not in the web app.
		return sessionUserSchema.parse({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			departmentId: user.departmentId,
		});
	}),
});

export const appRouter = router({
	health: healthRouter,
	auth: authRouter,
	audit: auditRouter,
	// domain routers (departments, incidents, ...) mount here later
});

export type AppRouter = typeof appRouter;
