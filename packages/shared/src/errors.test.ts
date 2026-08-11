import { describe, expect, it } from "vitest";

import { apiErrorSchema } from "./errors.js";

describe("apiErrorSchema", () => {
	it("accepts a tRPC error code", () => {
		expect(
			apiErrorSchema.parse({ code: "UNAUTHORIZED", message: "nope" }).code,
		).toBe("UNAUTHORIZED");
	});

	it("carries per-field validation messages", () => {
		const parsed = apiErrorSchema.parse({
			code: "BAD_REQUEST",
			message: "invalid",
			fieldErrors: { email: ["Enter a valid email"] },
		});
		expect(parsed.fieldErrors).toEqual({ email: ["Enter a valid email"] });
	});

	it("rejects a code tRPC would never throw", () => {
		expect(
			apiErrorSchema.safeParse({ code: "TEAPOT", message: "no" }).success,
		).toBe(false);
	});
});
