import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface SchemaNode {
	$ref?: string;
	type?: string;
	title?: string;
	description?: string;
	enum?: string[];
	const?: string | number | boolean;
	format?: string;
	items?: SchemaNode;
	properties?: Record<string, SchemaNode>;
	required?: string[];
	additionalProperties?: boolean | SchemaNode;
	anyOf?: SchemaNode[];
	oneOf?: SchemaNode[];
	discriminator?: { propertyName: string; mapping?: Record<string, string> };
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	minItems?: number;
	maxItems?: number;
}

export interface Spec {
	version: string;
	serverUrl: string;
	sha256: string;
	schemas: Record<string, SchemaNode>;
}

/**
 * The upstream framework checkout (`ulfsri/neris-framework`). Gitignored, so
 * every entry point has to cope with it being absent rather than assume it.
 */
export function nerisRoot(): string {
	const fromEnv = process.env.NERIS_FRAMEWORK_PATH;
	if (fromEnv) {
		return resolve(fromEnv);
	}
	return resolve(import.meta.dirname, "../../../../NERIS");
}

export function hasNerisCheckout(): boolean {
	return existsSync(resolve(nerisRoot(), "openapi.json"));
}

export function loadSpec(): Spec {
	const path = resolve(nerisRoot(), "openapi.json");
	if (!existsSync(path)) {
		throw new Error(
			`NERIS spec not found at ${path}. Clone https://github.com/ulfsri/neris-framework to NERIS/ at the repo root, or set NERIS_FRAMEWORK_PATH.`,
		);
	}
	const raw = readFileSync(path);
	const doc = JSON.parse(raw.toString("utf8")) as {
		info?: { version?: string };
		servers?: { url?: string }[];
		components?: { schemas?: Record<string, SchemaNode> };
	};
	const version = doc.info?.version;
	const serverUrl = doc.servers?.[0]?.url;
	const schemas = doc.components?.schemas;
	if (!version || !serverUrl || !schemas) {
		throw new Error(
			"spec is missing info.version, servers[0].url, or components.schemas",
		);
	}
	return {
		version,
		serverUrl,
		// Hashing the bytes on disk, not a re-serialisation, so the digest can be
		// compared against a freshly fetched spec without normalisation questions.
		sha256: createHash("sha256").update(raw).digest("hex"),
		schemas,
	};
}

/**
 * A digest of the schema graph that survives reserialisation. The byte hash of
 * `openapi.json` cannot be compared against the YAML the live API serves, so
 * drift detection needs a digest computed the same way on both sides.
 */
export function schemaDigest(schemas: Record<string, SchemaNode>): string {
	const canonical = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map(canonical);
		}
		if (typeof value !== "object" || value === null) {
			return value;
		}
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) {
			sorted[key] = canonical((value as Record<string, unknown>)[key]);
		}
		return sorted;
	};
	return createHash("sha256")
		.update(JSON.stringify(canonical(schemas)))
		.digest("hex");
}

export function refName(ref: string): string {
	const name = ref.split("/").pop();
	if (!name) {
		throw new Error(`unresolvable $ref: ${ref}`);
	}
	return name;
}

/** Every component schema reachable from `roots`, including the roots. */
export function reachableFrom(
	schemas: Record<string, SchemaNode>,
	roots: readonly string[],
): Set<string> {
	const seen = new Set<string>();
	const queue = [...roots];
	while (queue.length > 0) {
		const name = queue.pop();
		if (!name || seen.has(name)) {
			continue;
		}
		const schema = schemas[name];
		if (!schema) {
			throw new Error(`spec has no component schema named ${name}`);
		}
		seen.add(name);
		for (const dependency of directRefs(schema)) {
			if (!seen.has(dependency)) {
				queue.push(dependency);
			}
		}
	}
	return seen;
}

export function directRefs(node: unknown): Set<string> {
	const found = new Set<string>();
	const walk = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const item of value) {
				walk(item);
			}
			return;
		}
		if (typeof value !== "object" || value === null) {
			return;
		}
		for (const [key, child] of Object.entries(value)) {
			if (key === "$ref" && typeof child === "string") {
				found.add(refName(child));
			} else {
				walk(child);
			}
		}
	};
	walk(node);
	return found;
}

/**
 * Dependency order for emission, so a schema is always declared before the
 * consts that reference it. Self-references are reported rather than ordered —
 * the emitter turns those into getters, which is the only construct that can
 * close the loop (`LocationPayload` and `LocationResponse` contain themselves).
 */
export function topoSort(
	schemas: Record<string, SchemaNode>,
	names: Set<string>,
): { order: string[]; selfReferencing: Set<string> } {
	const selfReferencing = new Set<string>();
	const dependencies = new Map<string, string[]>();
	for (const name of names) {
		const schema = schemas[name];
		if (!schema) {
			throw new Error(`spec has no component schema named ${name}`);
		}
		const refs = [...directRefs(schema)].filter((ref) => names.has(ref));
		if (refs.includes(name)) {
			selfReferencing.add(name);
		}
		dependencies.set(
			name,
			refs.filter((ref) => ref !== name),
		);
	}

	const order: string[] = [];
	const state = new Map<string, "visiting" | "done">();
	const visit = (name: string, trail: string[]): void => {
		const current = state.get(name);
		if (current === "done") {
			return;
		}
		if (current === "visiting") {
			throw new Error(
				`unsupported $ref cycle: ${[...trail, name].join(" -> ")}. Only self-references can be emitted as getters.`,
			);
		}
		state.set(name, "visiting");
		for (const dependency of dependencies.get(name) ?? []) {
			visit(dependency, [...trail, name]);
		}
		state.set(name, "done");
		order.push(name);
	};
	for (const name of [...names].sort()) {
		visit(name, []);
	}
	return { order, selfReferencing };
}
