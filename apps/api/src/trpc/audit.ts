import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { auditLog, type Transaction, withTenant } from "@pyra/db";
import { departmentIdSchema } from "@pyra/shared";

import {
	assertOwnDepartment,
	requirePermission,
	router,
} from "./procedures.js";

export const auditActions = [
	"create",
	"update",
	"delete",
	"submit",
	"import",
] as const;
export const auditActionSchema = z.enum(auditActions);
export type AuditAction = z.infer<typeof auditActionSchema>;

export interface AuditEntry {
	departmentId: string;
	actorUserId: string | null;
	entityType: string;
	entityId: string;
	action: AuditAction;
	before?: unknown;
	after?: unknown;
}

/**
 * The single writer for `audit_log` (PRD 6.4).
 *
 * It takes the transaction rather than opening its own, so the audit row and
 * the mutation it describes commit or roll back together. An audit trail that
 * can record a change which then fails to land is worse than none.
 */
export async function recordAudit(
	tx: Transaction,
	entry: AuditEntry,
): Promise<void> {
	await tx.insert(auditLog).values({
		departmentId: entry.departmentId,
		actorUserId: entry.actorUserId,
		entityType: entry.entityType,
		entityId: entry.entityId,
		action: entry.action,
		before: entry.before ?? null,
		after: entry.after ?? null,
	});
}

export const auditRouter = router({
	/**
	 * `departmentId` is in the input on purpose, and the server refuses it when
	 * it disagrees with the session. Carrying the caller's belief about which
	 * tenant it is in turns a client-side scoping bug into a 403 instead of
	 * silently answering with the session's department.
	 */
	list: requirePermission("audit:read")
		.input(
			z.object({
				departmentId: departmentIdSchema,
				limit: z.int().min(1).max(200).default(50),
			}),
		)
		.query(({ ctx, input }) => {
			assertOwnDepartment(ctx.departmentId, input.departmentId);
			return withTenant(ctx.departmentId, (tx) =>
				tx
					.select()
					.from(auditLog)
					.where(eq(auditLog.departmentId, input.departmentId))
					.orderBy(desc(auditLog.at))
					.limit(input.limit),
			);
		}),
});
