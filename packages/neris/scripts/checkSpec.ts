import { load } from "js-yaml";

import {
	NERIS_SPEC_SCHEMA_DIGEST,
	NERIS_SPEC_SERVER_URL,
	NERIS_SPEC_VERSION,
} from "../src/generated/version.js";
import { schemaDigest, type SchemaNode } from "./lib/spec.js";

/**
 * Fails when the live NERIS spec has moved away from the snapshot
 * `src/generated/` was built from.
 *
 * This runs on a schedule, never on the pull-request job. A contributor's PR
 * must not go red because upstream shipped a release on a Tuesday — what we
 * want is a notification that regeneration is due, addressed to the project
 * rather than to whoever happened to open a PR that morning.
 */
async function main(): Promise<void> {
	const base = process.env.NERIS_API_BASE_URL ?? NERIS_SPEC_SERVER_URL;
	const url = `${base.replace(/\/$/, "")}/openapi.yaml`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`GET ${url} returned ${response.status} ${response.statusText}`,
		);
	}
	const document = load(await response.text());
	if (typeof document !== "object" || document === null) {
		throw new Error(`${url} did not parse to a mapping`);
	}
	const live = document as {
		info?: { version?: string };
		components?: { schemas?: Record<string, SchemaNode> };
	};
	const liveVersion = live.info?.version;
	const liveSchemas = live.components?.schemas;
	if (!liveVersion || !liveSchemas) {
		throw new Error(`${url} is missing info.version or components.schemas`);
	}

	const liveDigest = schemaDigest(liveSchemas);
	if (
		liveVersion === NERIS_SPEC_VERSION &&
		liveDigest === NERIS_SPEC_SCHEMA_DIGEST
	) {
		console.log(`NERIS ${liveVersion} matches the generated snapshot.`);
		return;
	}

	console.error(`NERIS spec drift detected against ${url}`);
	console.error(
		`  generated from: ${NERIS_SPEC_VERSION} (${NERIS_SPEC_SCHEMA_DIGEST.slice(0, 12)})`,
	);
	console.error(
		`  live:           ${liveVersion} (${liveDigest.slice(0, 12)})`,
	);
	console.error("");
	console.error(
		"Refresh the NERIS/ checkout, then run: pnpm --filter @pyra/neris generate",
	);
	console.error(
		"Review the diff in src/generated/ before committing — that diff is the change review.",
	);
	process.exitCode = 1;
}

await main();
