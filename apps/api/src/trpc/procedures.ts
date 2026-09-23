import { initTRPC, TRPCError } from "@trpc/server";

import { can, type DepartmentId, departmentIdSchema, type Permission, userRoleSchema } from "@pyra/shared";

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

/**
 * Every tenant-scoped procedure starts here. Department and role are read from
 * the session row and never from procedure input — the session is the only
 * thing the caller cannot choose.
 */
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
	const departmentId = departmentIdSchema.safeParse(ctx.session.user.departmentId);
	const role = userRoleSchema.safeParse(ctx.session.user.role);
	if (!departmentId.success || !role.success) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "session carries no usable department scope",
		});
	}
	return next({ ctx: { ...ctx, departmentId: departmentId.data, role: role.data } });
});

export function requirePermission(permission: Permission) {
	return tenantProcedure.use(({ ctx, next }) => {
		if (!can(ctx.role, permission)) {
			throw new TRPCError({ code: "FORBIDDEN", message: `role ${ctx.role} cannot ${permission}` });
		}
		return next();
	});
}

/**
 * Row-level security already makes a cross-department read return nothing, but
 * nothing is indistinguishable from an empty department. Refusing the mismatch
 * outright says which of the two it was.
 */
export function assertOwnDepartment(scope: DepartmentId, claimed: DepartmentId): void {
	if (scope !== claimed) {
		throw new TRPCError({ code: "FORBIDDEN", message: "department id does not match the session" });
	}
}
