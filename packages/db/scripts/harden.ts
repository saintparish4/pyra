import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: resolve(import.meta.dirname, "../../../.env") });

// Runs as the owner, not as pyra_app: creating roles, granting, and forcing
// row-level security are all things the runtime role must not be able to do.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, { max: 1 });

async function ensureAppRole(): Promise<void> {
	const [existing] = await sql<{ present: boolean }[]>`
		select exists(select 1 from pg_roles where rolname = 'pyra_app') as present
	`;
	if (existing?.present) {
		return;
	}
	const password = process.env.PYRA_APP_PASSWORD;
	if (!password) {
		console.warn(
			"PYRA_APP_PASSWORD is not set — skipping creation of the pyra_app role.\n" +
				"Row-level security is still applied and still enforced, because the policies are FORCEd and therefore bind the owner too.",
		);
		return;
	}
	// format(%L) lets Postgres quote the password instead of interpolating it
	// into SQL text here.
	const [statement] = await sql<{ text: string }[]>`
		select format('create role pyra_app login password %L', ${password}) as text
	`;
	if (!statement) {
		throw new Error("could not build the create role statement");
	}
	await sql.unsafe(statement.text);
	console.log("created role pyra_app");
}

try {
	await ensureAppRole();
	const script = readFileSync(
		resolve(import.meta.dirname, "../sql/tenancy.sql"),
		"utf8",
	);
	// A multi-statement script needs the simple query protocol.
	await sql.unsafe(script).simple();
	console.log("applied sql/tenancy.sql");
} finally {
	await sql.end();
}
