import { describe, expect, it } from "vitest";

import { departmentIdSchema, userIdSchema } from "./ids.js";

const DEPARTMENT_ID = "3f1a7c2e-9b84-4d51-8c6f-2a0e5d7b1c93";

describe("departmentIdSchema", () => {
	it("accepts a uuid", () => {
		expect(departmentIdSchema.parse(DEPARTMENT_ID)).toBe(DEPARTMENT_ID);
	});

	it("rejects a value that is not a uuid", () => {
		expect(departmentIdSchema.safeParse("bluesky").success).toBe(false);
	});
});

describe("userIdSchema", () => {
	it("accepts an id that is not a uuid", () => {
		// better-auth mints its own ids; only the seed happens to use randomUUID.
		expect(userIdSchema.parse("QLmT3xR8")).toBe("QLmT3xR8");
	});

	it("rejects an empty id", () => {
		expect(userIdSchema.safeParse("").success).toBe(false);
	});
});
