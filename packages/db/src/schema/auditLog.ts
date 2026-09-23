import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { departments } from "./departments.js";
import { users } from "./users.js";

/**
 * Append-only record of every mutation, required by PRD 6.4.
 *
 * Written through `recordAudit()` in the tRPC layer rather than by database
 * triggers: a trigger is invisible from TypeScript, cannot see who the actor
 * was without another session variable, and cannot be unit-tested. The runtime
 * role holds INSERT and SELECT only — see sql/tenancy.sql.
 *
 * `actorUserId` is nullable and survives the user being deleted, because an
 * audit trail that disappears with its subject is not an audit trail.
 */
export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		departmentId: uuid("department_id")
			.notNull()
			.references(() => departments.id, { onDelete: "cascade" }),
		actorUserId: text("actor_user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		action: text("action").notNull(),
		before: jsonb("before"),
		after: jsonb("after"),
		at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("audit_log_department_at_idx").on(table.departmentId, table.at),
		index("audit_log_entity_idx").on(
			table.departmentId,
			table.entityType,
			table.entityId,
		),
	],
);
