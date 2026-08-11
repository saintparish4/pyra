import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Same rule as src/env.ts: this module must be evaluated before anything that
// reads process.env at module scope (@pyra/db, ../auth), so it stays a
// side-effect import listed first in the setup file.
const repoRoot = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../../../..",
);

// dotenv keeps the first value it finds for a key, so .env.test only has to
// carry what differs for tests (DATABASE_URL) — the rest still comes from .env.
const envFiles = [".env.test", ".env"]
	.map((file) => resolve(repoRoot, file))
	.filter((file) => existsSync(file));
if (envFiles.length > 0) {
	config({ path: envFiles, quiet: true });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}

// Integration tests truncate every table between cases. Refusing anything but
// a *_test database keeps a stray DATABASE_URL from wiping a working one.
const databaseName = new URL(databaseUrl).pathname.slice(1);
if (!databaseName.endsWith("_test")) {
	throw new Error(
		`integration tests refuse to run against "${databaseName}" — point DATABASE_URL at a database whose name ends in _test`,
	);
}
