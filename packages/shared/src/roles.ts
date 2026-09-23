import { z } from "zod";

/**
 * `users.role`. The column is plain text with no check constraint — better-auth
 * writes it through its own adapter — so widening the set is a change here, not
 * a migration. The two roles that predate this list, `admin` and `member`, are
 * still members of it, so existing rows stay valid.
 */
export const userRoles = ["admin", "officer", "member", "readonly"] as const;
export const userRoleSchema = z.enum(userRoles);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * What a role may do, named after the operation rather than the route, so the
 * matrix survives the API being reshaped.
 */
export const permissions = [
	"incident:read",
	"incident:create",
	"incident:update",
	"incident:delete",
	"incident:submit",
	"import:run",
	"export:run",
	"audit:read",
	"department:manage",
	"user:manage",
] as const;
export const permissionSchema = z.enum(permissions);
export type Permission = z.infer<typeof permissionSchema>;

/**
 * Deliberately coarse: this answers "may this role ever do this", not "may this
 * user do this to this row". Ownership rules — a member editing their own draft
 * but not someone else's — are row-level and belong to the procedure that has
 * the row in hand.
 *
 * Submission is an officer's job on purpose. A NERIS submission is a legal
 * filing under the department's entity ID, and the person who wrote the report
 * is not always the person accountable for filing it.
 */
const MATRIX: Readonly<Record<UserRole, readonly Permission[]>> = {
	readonly: ["incident:read"],
	member: ["incident:read", "incident:create", "incident:update"],
	officer: [
		"incident:read",
		"incident:create",
		"incident:update",
		"incident:delete",
		"incident:submit",
		"import:run",
		"export:run",
		"audit:read",
	],
	admin: [...permissions],
};

export function can(role: UserRole, permission: Permission): boolean {
	return MATRIX[role].includes(permission);
}

export function permissionsFor(role: UserRole): readonly Permission[] {
	return MATRIX[role];
}
