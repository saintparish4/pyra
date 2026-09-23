import { describe, expect, it } from "vitest";

import type { ValueSetEntry } from "./generated/valueSets.js";
import { childrenOf, labelOf, offerableValues } from "./valueSetHelpers.js";

function entry(value: string, active: boolean): ValueSetEntry {
	const levels = value.split("||");
	return {
		label: levels.at(-1) ?? value,
		labelPath: levels,
		levels,
		definition: "",
		source: "",
		active,
	};
}

const values = [
	"FIRE",
	"FIRE||STRUCTURE_FIRE",
	"FIRE||OUTSIDE_FIRE",
	"MEDICAL",
	"RETIRED",
] as const;
const meta: Readonly<Record<(typeof values)[number], ValueSetEntry>> = {
	FIRE: entry("FIRE", true),
	"FIRE||STRUCTURE_FIRE": entry("FIRE||STRUCTURE_FIRE", true),
	"FIRE||OUTSIDE_FIRE": entry("FIRE||OUTSIDE_FIRE", false),
	MEDICAL: entry("MEDICAL", true),
	RETIRED: entry("RETIRED", false),
};

describe("offerableValues", () => {
	it("omits retired values so they cannot be chosen for a new record", () => {
		expect(offerableValues(values, meta)).toEqual([
			"FIRE",
			"FIRE||STRUCTURE_FIRE",
			"MEDICAL",
		]);
	});

	it("still labels a retired value, so an old record stays readable", () => {
		expect(labelOf("RETIRED", meta)).toBe("RETIRED");
	});
});

describe("childrenOf", () => {
	it("returns the top level for an empty parent", () => {
		expect(childrenOf(values, [])).toEqual(["FIRE", "MEDICAL", "RETIRED"]);
	});

	it("descends exactly one level", () => {
		expect(childrenOf(values, ["FIRE"])).toEqual([
			"FIRE||STRUCTURE_FIRE",
			"FIRE||OUTSIDE_FIRE",
		]);
	});

	it("returns nothing for a leaf, so a picker knows when to stop", () => {
		expect(childrenOf(values, ["MEDICAL"])).toEqual([]);
	});
});
