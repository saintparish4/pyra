import type { ValueSetEntry } from "./generated/valueSets.js";

/**
 * Values a picker may offer for a *new* record.
 *
 * Retired values stay in the enum on purpose: an incident written in 2026 must
 * still render correctly in 2030 after its type has been deprecated upstream.
 * Readable forever, offerable only while active.
 */
export function offerableValues<T extends string>(
	values: readonly T[],
	meta: Readonly<Record<T, ValueSetEntry>>,
): T[] {
	return values.filter((value) => meta[value].active);
}

/** The human label for a value, falling back to the value itself. */
export function labelOf<T extends string>(value: T, meta: Readonly<Record<T, ValueSetEntry>>): string {
	return meta[value].label;
}

/**
 * Children of `parent` one level down, for a variable-depth type picker.
 *
 * NERIS hierarchies are not uniformly three levels — `LAWENFORCE` has one,
 * `MEDICAL||ILLNESS` two, `FIRE||OUTSIDE_FIRE||TRASH_RUBBISH_FIRE` three — so a
 * picker has to ask what exists below a node rather than assume a depth.
 */
export function childrenOf<T extends string>(values: readonly T[], parent: readonly string[]): T[] {
	const prefix = parent.join("||");
	const depth = parent.length;
	const seen = new Set<string>();
	const children: T[] = [];
	for (const value of values) {
		const levels = value.split("||");
		if (levels.length !== depth + 1) {
			continue;
		}
		if (depth > 0 && !value.startsWith(`${prefix}||`)) {
			continue;
		}
		if (!seen.has(value)) {
			seen.add(value);
			children.push(value);
		}
	}
	return children;
}
