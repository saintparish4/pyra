import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { departments } from "./departments.js";

// Column names/types match better-auth's expected "user" table shape
// (id, name, email, emailVerified, image, createdAt, updatedAt) so the
// auth tables it generates later can adopt this table without a rewrite.
// departmentId and role are our own additions for tenancy + RBAC.
export const users = pgTable("users", {
	id: text("id").primaryKey(),
	departmentId: uuid("department_id")
		.notNull()
		.references(() => departments.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: text("role").notNull().default("member"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
