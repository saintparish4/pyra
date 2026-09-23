import { literal, propertyKey, schemaConst } from "./names.js";
import { directRefs, refName, type SchemaNode } from "./spec.js";

export interface EmitContext {
	/** The schema currently being emitted, so self-references become getters. */
	readonly self: string;
}

/**
 * JSON Schema node -> a zod expression.
 *
 * Every construct the NERIS spec actually uses is handled explicitly and
 * anything else throws. A generator that falls back to `z.unknown()` produces
 * a validator that passes bad payloads, which is worse than not generating.
 */
export function zodFor(node: SchemaNode, context: EmitContext): string {
	if (node.$ref) {
		return schemaConst(refName(node.$ref));
	}
	if (node.const !== undefined) {
		return `z.literal(${literal(node.const)})`;
	}
	if (node.enum) {
		return `z.enum([${node.enum.map((value) => JSON.stringify(value)).join(", ")}])`;
	}
	if (node.oneOf) {
		return union(node.oneOf, node, context);
	}
	if (node.anyOf) {
		return anyOf(node.anyOf, node, context);
	}
	switch (node.type) {
		case "string":
			return stringSchema(node);
		case "integer":
			return numeric("z.int()", node);
		case "number":
			return numeric("z.number()", node);
		case "boolean":
			return "z.boolean()";
		case "null":
			return "z.null()";
		case "array":
			return arraySchema(node, context);
		case "object":
			return objectSchema(node, context);
		default:
			throw new Error(`unsupported schema node: ${JSON.stringify(node).slice(0, 200)}`);
	}
}

/**
 * FastAPI renders `Optional[X]` as `anyOf: [X, {type: null}]`, so the null
 * member is stripped and re-applied as `.nullable()` rather than emitted as a
 * union arm — otherwise every optional field becomes a two-arm union.
 */
function anyOf(members: SchemaNode[], node: SchemaNode, context: EmitContext): string {
	const nullable = members.some((member) => member.type === "null");
	const rest = members.filter((member) => member.type !== "null");
	if (rest.length === 0) {
		throw new Error(`anyOf with no non-null member: ${node.title ?? "<untitled>"}`);
	}
	const base = rest.length === 1 ? zodFor(rest[0] as SchemaNode, context) : union(rest, node, context);
	return nullable ? `${base}.nullable()` : base;
}

function union(members: SchemaNode[], node: SchemaNode, context: EmitContext): string {
	const discriminator = node.discriminator;
	if (discriminator?.mapping) {
		const arms = Object.values(discriminator.mapping).map((ref) => schemaConst(refName(ref)));
		return `z.discriminatedUnion(${JSON.stringify(discriminator.propertyName)}, [${arms.join(", ")}])`;
	}
	const arms = members.map((member) => zodFor(member, context));
	return `z.union([${arms.join(", ")}])`;
}

function stringSchema(node: SchemaNode): string {
	if (node.format === "date-time") {
		// NERIS timestamps arrive both with an offset and without one; rejecting
		// the bare form here would fail payloads the API itself accepts.
		return "z.iso.datetime({ offset: true, local: true })";
	}
	if (node.format === "uri") {
		return "z.url()";
	}
	if (node.format) {
		throw new Error(`unsupported string format: ${node.format}`);
	}
	let expression = "z.string()";
	if (node.minLength !== undefined) {
		expression += `.min(${node.minLength})`;
	}
	if (node.maxLength !== undefined) {
		expression += `.max(${node.maxLength})`;
	}
	if (node.pattern !== undefined) {
		expression += `.regex(new RegExp(${JSON.stringify(node.pattern)}))`;
	}
	return expression;
}

function numeric(base: string, node: SchemaNode): string {
	let expression = base;
	if (node.minimum !== undefined) {
		expression += `.min(${node.minimum})`;
	}
	if (node.maximum !== undefined) {
		expression += `.max(${node.maximum})`;
	}
	if (node.exclusiveMinimum !== undefined) {
		expression += `.gt(${node.exclusiveMinimum})`;
	}
	if (node.exclusiveMaximum !== undefined) {
		expression += `.lt(${node.exclusiveMaximum})`;
	}
	return expression;
}

function arraySchema(node: SchemaNode, context: EmitContext): string {
	if (!node.items) {
		throw new Error("array schema without items");
	}
	let expression = `z.array(${zodFor(node.items, context)})`;
	if (node.minItems !== undefined) {
		expression += `.min(${node.minItems})`;
	}
	if (node.maxItems !== undefined) {
		expression += `.max(${node.maxItems})`;
	}
	return expression;
}

function objectSchema(node: SchemaNode, context: EmitContext): string {
	const extra = node.additionalProperties;
	if (!node.properties) {
		if (extra && typeof extra === "object") {
			return `z.record(z.string(), ${zodFor(extra, context)})`;
		}
		return "z.record(z.string(), z.unknown())";
	}
	const required = new Set(node.required ?? []);
	const lines: string[] = [];
	for (const [name, property] of Object.entries(node.properties)) {
		const optional = required.has(name) ? "" : ".optional()";
		const expression = `${zodFor(property, context)}${optional}`;
		// A property whose subtree points back at the schema being emitted can
		// only be expressed lazily; zod reads the getter after the binding exists.
		if (directRefs(property).has(context.self)) {
			lines.push(`\tget ${propertyKey(name)}() {\n\t\treturn ${expression};\n\t},`);
		} else {
			lines.push(`\t${propertyKey(name)}: ${expression},`);
		}
	}
	const factory = extra === false ? "z.strictObject" : extra === true ? "z.looseObject" : "z.object";
	return `${factory}({\n${lines.join("\n")}\n})`;
}
