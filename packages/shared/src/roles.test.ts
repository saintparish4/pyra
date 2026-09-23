import { describe, expect, it } from "vitest";

import {
	can,
	permissions,
	permissionsFor,
	userRoleSchema,
	userRoles,
} from "./roles.js";

describe("userRoles", () => {
	it("still accepts the roles that existing rows were written with", () => {
		expect(userRoleSchema.safeParse("admin").success).toBe(true);
		expect(userRoleSchema.safeParse("member").success).toBe(true);
	});

	it("rejects a role outside the set", () => {
		expect(userRoleSchema.safeParse("chief").success).toBe(false);
	});
});

describe("can", () => {
	it("lets a read-only member read incidents and nothing else", () => {
		expect(can("readonly", "incident:read")).toBe(true);
		expect(can("readonly", "incident:create")).toBe(false);
		expect(can("readonly", "export:run")).toBe(false);
	});

	it("lets a member write reports but not file them with NERIS", () => {
		expect(can("member", "incident:create")).toBe(true);
		expect(can("member", "incident:update")).toBe(true);
		expect(can("member", "incident:submit")).toBe(false);
		expect(can("member", "incident:delete")).toBe(false);
	});

	it("lets an officer submit, import, export, and read the audit log", () => {
		expect(can("officer", "incident:submit")).toBe(true);
		expect(can("officer", "import:run")).toBe(true);
		expect(can("officer", "export:run")).toBe(true);
		expect(can("officer", "audit:read")).toBe(true);
	});

	it("does not let an officer manage the department or its users", () => {
		expect(can("officer", "department:manage")).toBe(false);
		expect(can("officer", "user:manage")).toBe(false);
	});

	it("grants an admin every permission", () => {
		for (const permission of permissions) {
			expect(can("admin", permission)).toBe(true);
		}
	});
});

describe("permissionsFor", () => {
	it("grows monotonically from readonly to officer", () => {
		for (const role of ["readonly", "member"] as const) {
			for (const permission of permissionsFor(role)) {
				expect(can("officer", permission)).toBe(true);
			}
		}
	});

	it("never grants a permission outside the declared set", () => {
		for (const role of userRoles) {
			for (const permission of permissionsFor(role)) {
				expect(permissions).toContain(permission);
			}
		}
	});
});
