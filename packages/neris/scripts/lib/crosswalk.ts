import { loadValueSetFile } from "./valueSets.js";

/**
 * The crosswalk is not a function. 161 of the 164 distinct NFIRS codes in
 * `type_incident.yml` map to more than one NERIS type, and code 300 maps to
 * dozens. Emitting arrays — never a scalar — is what forces every consumer to
 * confront that instead of silently taking the first candidate.
 */
export function buildCrosswalk(apiValues: readonly string[]): Map<string, string[]> {
	const raw = loadValueSetFile("type_incident.yml");
	if (!raw) {
		throw new Error("type_incident.yml is missing; the NFIRS crosswalk cannot be generated");
	}
	const members = new Set(apiValues);
	const byCode = new Map<string, Set<string>>();
	for (const entry of Object.values(raw)) {
		const levels = [entry.value_1, entry.value_2, entry.value_3]
			.map((level) => (level === undefined || level === null ? "" : String(level).trim()))
			.filter(Boolean);
		const value = levels.join("||");
		// Dropped for the same reason as everywhere else: the API decides
		// membership. A YAML-only spelling has no NERIS type to map onto.
		if (!members.has(value)) {
			continue;
		}
		const codes = entry["NFIRS Crosswalk"];
		if (codes === undefined || codes === null) {
			continue;
		}
		for (const code of String(codes).split(",")) {
			const trimmed = code.trim();
			if (!trimmed) {
				continue;
			}
			const bucket = byCode.get(trimmed) ?? new Set<string>();
			bucket.add(value);
			byCode.set(trimmed, bucket);
		}
	}
	const sorted = [...byCode.entries()].sort(([a], [b]) => a.localeCompare(b));
	return new Map(sorted.map(([code, values]) => [code, [...values].sort()]));
}

export function emitCrosswalk(crosswalk: ReadonlyMap<string, string[]>): string {
	const lines: string[] = [
		'import type { TypeIncidentValue } from "./valueSets.js";',
		"",
		"export const nfirsCodes = [",
		...[...crosswalk.keys()].map((code) => `\t${JSON.stringify(code)},`),
		"] as const;",
		"export type NfirsCode = (typeof nfirsCodes)[number];",
		"",
		"/**",
		" * NFIRS 5.0 incident type code -> every NERIS type it could mean.",
		" *",
		" * A candidate set, never an answer. An importer that picks one of these",
		" * automatically will mis-type most of a department's history.",
		" */",
		"export const nfirsCrosswalk: Readonly<Record<NfirsCode, readonly TypeIncidentValue[]>> = {",
	];
	for (const [code, values] of crosswalk) {
		lines.push(`\t${JSON.stringify(code)}: [${values.map((value) => JSON.stringify(value)).join(", ")}],`);
	}
	lines.push("};", "");
	return lines.join("\n");
}
