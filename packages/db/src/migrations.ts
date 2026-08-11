import { fileURLToPath } from "node:url";

/**
 * Where drizzle-kit writes this package's migrations. Exported so callers that
 * migrate at runtime (integration test setup, deploy jobs) do not hard-code a
 * relative path out of their own workspace.
 */
export const migrationsFolder = fileURLToPath(
	new URL("../drizzle", import.meta.url),
);
