import { describe, expect, it } from "vitest";

import { build, readGenerated } from "./generate.js";
import { hasNerisCheckout } from "./lib/spec.js";

// The framework checkout is gitignored, so these cannot run in CI. The facts
// they would protect are asserted against the committed output instead, in
// src/dictionary.test.ts, which needs nothing but the repo.
describe.skipIf(!hasNerisCheckout())("generate", () => {
	it("regenerating the dictionary produces no diff", () => {
		for (const file of build().files) {
			expect(
				readGenerated(file.relativePath),
				`${file.relativePath} is stale`,
			).toBe(file.contents);
		}
	});

	it("drops the value sets carry that the API does not", () => {
		const { report } = build();
		expect(report.dropped).toContainEqual({
			set: "TypeIncidentValue",
			value: "RESCUE||OUTSIDE||BACKOUNTRY_RESCUE",
		});
	});

	it("labels by value the types the API carries and the value sets do not", () => {
		const { report } = build();
		const unlabelled = report.unlabelled
			.filter((entry) => entry.set === "TypeIncidentValue")
			.map((entry) => entry.value);
		expect(unlabelled).toEqual([
			"MEDICAL||ILLNESS",
			"MEDICAL||INJURY",
			"RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE",
		]);
	});
});
