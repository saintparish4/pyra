import { describe, expect, it } from "vitest";

import { nfirsCrosswalk } from "./generated/nfirsCrosswalk.js";
import { patchIncidentActionSchema } from "./generated/schemas.js";
import { typeIncidentValueMeta, typeIncidentValues } from "./generated/valueSets.js";
import { NERIS_SPEC_VERSION } from "./generated/version.js";

describe("incident types", () => {
	it("takes membership from the API, not from the value-set YAML", () => {
		expect(typeIncidentValues).toHaveLength(130);
		expect(typeIncidentValues).toContain("LAWENFORCE");
		expect(typeIncidentValues).toContain("MEDICAL||ILLNESS");
	});

	it("carries the API's spelling of BACKCOUNTRY_RESCUE, not the YAML's typo", () => {
		expect(typeIncidentValues).toContain("RESCUE||OUTSIDE||BACKCOUNTRY_RESCUE");
		expect(typeIncidentValues).not.toContain("RESCUE||OUTSIDE||BACKOUNTRY_RESCUE");
	});

	it("is variable depth — a picker cannot assume three levels", () => {
		expect(typeIncidentValueMeta.LAWENFORCE.levels).toEqual(["LAWENFORCE"]);
		expect(typeIncidentValueMeta["MEDICAL||ILLNESS"].levels).toEqual(["MEDICAL", "ILLNESS"]);
		expect(typeIncidentValueMeta["FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE"].levels).toEqual([
			"FIRE",
			"OUTSIDE_FIRE",
			"TRASH_RUBBISH_FIRE",
		]);
	});

	it("labels from the YAML where it has one", () => {
		expect(typeIncidentValueMeta.LAWENFORCE.label).toBe("Law Enforcement Support");
	});

	it("falls back to the value as its own label where the YAML has none", () => {
		expect(typeIncidentValueMeta["MEDICAL||ILLNESS"].label).toBe("MEDICAL||ILLNESS");
	});
});

describe("nfirs crosswalk", () => {
	it("is a candidate set, not a function", () => {
		const entries = Object.entries(nfirsCrosswalk);
		const ambiguous = entries.filter(([, candidates]) => candidates.length > 1);
		expect(entries).toHaveLength(164);
		expect(ambiguous).toHaveLength(161);
	});

	it("maps NFIRS 300 onto dozens of NERIS types", () => {
		// 53, not the 54 rows the YAML carries: one of them is the
		// BACKOUNTRY_RESCUE typo, which has no NERIS type to map onto and is
		// dropped. This number goes to 54 when upstream fixes the spelling.
		expect(nfirsCrosswalk["300"]).toHaveLength(53);
	});

	it("never yields a bare value", () => {
		for (const candidates of Object.values(nfirsCrosswalk)) {
			expect(Array.isArray(candidates)).toBe(true);
		}
	});
});

describe("generated schemas", () => {
	it("pins the spec version the output was built from", () => {
		expect(NERIS_SPEC_VERSION).toBe("1.4.78");
	});

	it("enforces the deterministic incident id pattern", () => {
		const failedPaths = (nerisId: string): string[] => {
			const result = patchIncidentActionSchema.safeParse({
				neris_id: nerisId,
				action: "patch",
				properties: {},
			});
			return result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
		};

		expect(failedPaths("FD12345678|abc123xyz|1729023498")).not.toContain("neris_id");
		expect(failedPaths("not-an-incident-id")).toContain("neris_id");
	});
});
