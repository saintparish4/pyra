import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

/**
 * Runtime connects as the non-owner `pyra_app` role so row-level security
 * applies to it (ADR-0003); migrations keep running as the owner through
 * `DATABASE_URL`. The fallback means a single-department self-host that never
 * creates the second role still works unchanged.
 */
const connectionString = process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("neither APP_DATABASE_URL nor DATABASE_URL is set");
}

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
