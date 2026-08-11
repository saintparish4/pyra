import { describe, expect, it } from "vitest";

import { sessionUserSchema, signInInputSchema } from "./auth.js";

const DEPARTMENT_ID = "3f1a7c2e-9b84-4d51-8c6f-2a0e5d7b1c93";

const SESSION_USER = {
	id: "QLmT3xR8",
	name: "Admin",
	email: "admin@pyra.local",
	role: "admin",
	departmentId: DEPARTMENT_ID,
};

describe("signInInputSchema", () => {
	it("accepts an email and a password", () => {
		expect(
			signInInputSchema.parse({
				email: "admin@pyra.local",
				password: "hunter2",
			}),
		).toEqual({ email: "admin@pyra.local", password: "hunter2" });
	});

	it("rejects a malformed email", () => {
		expect(
			signInInputSchema.safeParse({ email: "admin", password: "hunter2" })
				.success,
		).toBe(false);
	});

	it("rejects an empty password", () => {
		expect(
			signInInputSchema.safeParse({ email: "admin@pyra.local", password: "" })
				.success,
		).toBe(false);
	});
});

describe("sessionUserSchema", () => {
	it("parses the auth.me payload", () => {
		const parsed = sessionUserSchema.parse(SESSION_USER);
		expect(parsed.departmentId).toBe(DEPARTMENT_ID);
		expect(parsed.role).toBe("admin");
	});

	it("rejects a role outside the department roles", () => {
		expect(
			sessionUserSchema.safeParse({ ...SESSION_USER, role: "superuser" })
				.success,
		).toBe(false);
	});

	it("rejects a department id that is not a uuid", () => {
		expect(
			sessionUserSchema.safeParse({ ...SESSION_USER, departmentId: "bluesky" })
				.success,
		).toBe(false);
	});
});
