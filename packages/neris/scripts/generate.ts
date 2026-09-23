import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildCrosswalk, emitCrosswalk } from "./lib/crosswalk.js";
import { header, schemaConst } from "./lib/names.js";
import { loadSpec, reachableFrom, schemaDigest, topoSort } from "./lib/spec.js";
import { emitValueSets, type ValueSetReport } from "./lib/valueSets.js";
import { zodFor } from "./lib/zod.js";

/**
 * Everything Pyra submits or reads back. The subgraph reachable from these is
 * ~550 of the spec's 738 component schemas; the remainder are analytics and
 * administrative surfaces we do not touch.
 */
const ROOTS = [
	"IncidentPayload",
	"PutIncidentPayload",
	"PatchIncidentAction",
	"CreateDepartmentPayload",
	"CreateStationPayload",
	"CreateUnitPayload",
	"NoActivityReportPayload",
	"IncidentResponse",
	"StationResponse",
	"UnitResponse",
	"NoActivityReportResponse",
	"HTTPValidationError",
	"ErrorResponse",
] as const;

export interface GeneratedFile {
	relativePath: string;
	contents: string;
}

export interface BuildResult {
	files: GeneratedFile[];
	report: ValueSetReport;
}

export function generatedDir(): string {
	return resolve(import.meta.dirname, "../src/generated");
}

export function build(): BuildResult {
	const spec = loadSpec();
	const report: ValueSetReport = { missingFiles: [], unlabelled: [], dropped: [] };

	const enums = new Map<string, readonly string[]>();
	for (const [name, schema] of Object.entries(spec.schemas)) {
		if (schema.enum) {
			enums.set(name, schema.enum);
		}
	}

	const incidentValues = enums.get("TypeIncidentValue");
	if (!incidentValues) {
		throw new Error("spec has no TypeIncidentValue enum");
	}

	const reachable = reachableFrom(spec.schemas, ROOTS);
	const objectNames = new Set([...reachable].filter((name) => !enums.has(name)));
	const { order, selfReferencing } = topoSort(spec.schemas, objectNames);

	const usedEnums = [...reachable]
		.filter((name) => enums.has(name))
		.sort()
		.map(schemaConst);

	const schemaLines: string[] = [
		'import { z } from "zod";',
		"",
		`import {\n${usedEnums.map((name) => `\t${name},`).join("\n")}\n} from "./valueSets.js";`,
		"",
	];
	for (const name of order) {
		const schema = spec.schemas[name];
		if (!schema) {
			throw new Error(`spec has no component schema named ${name}`);
		}
		if (selfReferencing.has(name)) {
			schemaLines.push(
				"// Self-referencing: the recursive property is a getter so zod reads it",
				"// after the binding exists.",
			);
		}
		schemaLines.push(`export const ${schemaConst(name)} = ${zodFor(schema, { self: name })};`);
		schemaLines.push(`export type ${name} = z.infer<typeof ${schemaConst(name)}>;`);
		schemaLines.push("");
	}

	const crosswalk = buildCrosswalk(incidentValues);

	const version = [
		`export const NERIS_SPEC_VERSION = ${JSON.stringify(spec.version)};`,
		"",
		"/** sha256 of the `openapi.json` these files were generated from. */",
		`export const NERIS_SPEC_SHA256 = ${JSON.stringify(spec.sha256)};`,
		"",
		"/** The server the spec snapshot describes. Production is set per department. */",
		`export const NERIS_SPEC_SERVER_URL = ${JSON.stringify(spec.serverUrl)};`,
		"",
		"/**",
		" * Digest of the schema graph, independent of JSON/YAML serialisation, so",
		" * `pnpm --filter @pyra/neris check-spec` can compare it against the live API.",
		" */",
		`export const NERIS_SPEC_SCHEMA_DIGEST = ${JSON.stringify(schemaDigest(spec.schemas))};`,
		"",
	].join("\n");

	const index = [
		'export * from "./nfirsCrosswalk.js";',
		'export * from "./schemas.js";',
		'export * from "./valueSets.js";',
		'export * from "./version.js";',
		"",
	].join("\n");

	const prefix = header(spec.version);
	return {
		report,
		files: [
			{ relativePath: "valueSets.ts", contents: prefix + emitValueSets(enums, report) },
			{ relativePath: "schemas.ts", contents: prefix + schemaLines.join("\n") },
			{ relativePath: "nfirsCrosswalk.ts", contents: prefix + emitCrosswalk(crosswalk) },
			{ relativePath: "version.ts", contents: prefix + version },
			{ relativePath: "index.ts", contents: prefix + index },
		],
	};
}

export function readGenerated(relativePath: string): string | undefined {
	try {
		return readFileSync(resolve(generatedDir(), relativePath), "utf8");
	} catch {
		return undefined;
	}
}

function describe(report: ValueSetReport): string[] {
	const lines: string[] = [];
	if (report.missingFiles.length > 0) {
		lines.push(
			`${report.missingFiles.length} spec enums have no value-set YAML (labels fall back to the value): ${report.missingFiles.join(", ")}`,
		);
	}
	for (const { set, value } of report.unlabelled) {
		lines.push(`unlabelled: ${set} carries "${value}", the YAML does not — labelled by its own value`);
	}
	for (const { set, value } of report.dropped) {
		lines.push(`dropped: the YAML for ${set} carries "${value}", the API does not`);
	}
	return lines;
}

function main(): void {
	const { files, report } = build();
	const target = generatedDir();
	mkdirSync(target, { recursive: true });
	for (const file of files) {
		const path = resolve(target, file.relativePath);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, file.contents);
		console.log(`wrote ${path}`);
	}
	for (const line of describe(report)) {
		console.warn(line);
	}
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
	main();
}
