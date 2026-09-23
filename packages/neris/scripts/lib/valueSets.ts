import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { load } from "js-yaml";

import { metaConst, schemaConst, valueSetFileName, valuesConst } from "./names.js";
import { nerisRoot } from "./spec.js";

export interface ValueSetEntry {
	label: string;
	labelPath: string[];
	levels: string[];
	definition: string;
	source: string;
	active: boolean;
}

export interface ValueSetReport {
	/** Enum in the spec with no companion YAML — every label falls back. */
	missingFiles: string[];
	/** In the API but absent from the YAML: labelled by its own value. */
	unlabelled: { set: string; value: string }[];
	/** In the YAML but absent from the API: dropped, because the API decides membership. */
	dropped: { set: string; value: string }[];
}

export type RawEntry = Record<string, unknown>;

export function loadValueSetFile(fileName: string): Record<string, RawEntry> | undefined {
	const path = resolve(nerisRoot(), "CORE/value_sets/yml", fileName);
	if (!existsSync(path)) {
		return undefined;
	}
	const parsed = load(readFileSync(path, "utf8"));
	if (typeof parsed !== "object" || parsed === null) {
		throw new Error(`${fileName} did not parse to a mapping`);
	}
	return parsed as Record<string, RawEntry>;
}

function text(entry: RawEntry, key: string): string {
	const value = entry[key];
	return value === undefined || value === null ? "" : String(value).trim();
}

function boolish(entry: RawEntry, key: string, context: string): boolean {
	const value = text(entry, key).toUpperCase();
	if (value === "TRUE") {
		return true;
	}
	if (value === "FALSE") {
		return false;
	}
	throw new Error(`${context}: expected TRUE or FALSE for "${key}", got "${text(entry, key)}"`);
}

/**
 * The YAML separates hierarchy levels with `: ` where the API uses `||`. Levels
 * are rebuilt from the `value_N` columns rather than by splitting the key,
 * because a description containing a colon would make the key ambiguous.
 */
function entryFor(key: string, raw: RawEntry, context: string): { value: string; entry: ValueSetEntry } {
	const hierarchical = raw.value_1 !== undefined;
	const levels = hierarchical
		? [text(raw, "value_1"), text(raw, "value_2"), text(raw, "value_3")].filter(Boolean)
		: [key];
	const labelPath = hierarchical
		? [text(raw, "description_1"), text(raw, "description_2"), text(raw, "description_3")].filter(Boolean)
		: [text(raw, "description")].filter(Boolean);
	const definitions = hierarchical
		? [text(raw, "definition_1"), text(raw, "definition_2"), text(raw, "definition_3")].filter(Boolean)
		: [text(raw, "definition")].filter(Boolean);
	const value = levels.join("||");
	return {
		value,
		entry: {
			label: labelPath.at(-1) ?? value,
			labelPath,
			levels,
			definition: definitions.at(-1) ?? "",
			source: text(raw, "source"),
			active: boolish(raw, "active", `${context}/${key}`),
		},
	};
}

function fallback(value: string): ValueSetEntry {
	const levels = value.split("||");
	return { label: value, labelPath: [value], levels, definition: "", source: "", active: true };
}

/**
 * The API is authoritative for membership, the YAML for labels. The two already
 * disagree — the spec carries `MEDICAL||ILLNESS`, `MEDICAL||INJURY`, and the
 * corrected spelling of `BACKCOUNTRY_RESCUE`, none of which the YAML has — and
 * upstream states the API wins. Both directions of the disagreement are
 * reported rather than silently reconciled.
 */
export function joinValueSet(
	setName: string,
	apiValues: readonly string[],
	report: ValueSetReport,
): Map<string, ValueSetEntry> {
	const fileName = valueSetFileName(setName);
	const raw = loadValueSetFile(fileName);
	if (!raw) {
		report.missingFiles.push(setName);
		return new Map(apiValues.map((value) => [value, fallback(value)]));
	}
	const labelled = new Map<string, ValueSetEntry>();
	for (const [key, rawEntry] of Object.entries(raw)) {
		const { value, entry } = entryFor(key, rawEntry, fileName);
		labelled.set(value, entry);
	}
	const joined = new Map<string, ValueSetEntry>();
	for (const value of apiValues) {
		const entry = labelled.get(value);
		if (entry) {
			joined.set(value, entry);
		} else {
			report.unlabelled.push({ set: setName, value });
			joined.set(value, fallback(value));
		}
	}
	for (const value of labelled.keys()) {
		if (!joined.has(value)) {
			report.dropped.push({ set: setName, value });
		}
	}
	return joined;
}

export function emitValueSets(
	enums: ReadonlyMap<string, readonly string[]>,
	report: ValueSetReport,
): string {
	const blocks: string[] = [
		'import { z } from "zod";',
		"",
		"export interface ValueSetEntry {",
		"\t/** The most specific human label — what a report writer reads in a picker. */",
		"\treadonly label: string;",
		"\t/** Labels from the outermost level inward, for breadcrumbs in the type picker. */",
		"\treadonly labelPath: readonly string[];",
		"\t/** Value segments. NERIS types are variable depth: 1, 2, or 3 levels. */",
		"\treadonly levels: readonly string[];",
		"\treadonly definition: string;",
		"\treadonly source: string;",
		"\t/** `false` values stay readable on existing records but are not offerable. */",
		"\treadonly active: boolean;",
		"}",
		"",
	];
	for (const [name, values] of [...enums].sort(([a], [b]) => a.localeCompare(b))) {
		const joined = joinValueSet(name, values, report);
		blocks.push(`export const ${valuesConst(name)} = [`);
		for (const value of values) {
			blocks.push(`\t${JSON.stringify(value)},`);
		}
		blocks.push("] as const;");
		blocks.push(`export type ${name} = (typeof ${valuesConst(name)})[number];`);
		blocks.push(`export const ${schemaConst(name)} = z.enum(${valuesConst(name)});`);
		blocks.push(`export const ${metaConst(name)}: Readonly<Record<${name}, ValueSetEntry>> = {`);
		for (const [value, entry] of joined) {
			blocks.push(`\t${JSON.stringify(value)}: ${JSON.stringify(entry)},`);
		}
		blocks.push("};");
		blocks.push("");
	}
	return blocks.join("\n");
}
