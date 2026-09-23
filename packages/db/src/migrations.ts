import { fileURLToPath } from "node:url";

/**
 * Where drizzle-kit writes this package's migrations. Exported so callers that
 * migrate at runtime (integration test setup, deploy jobs) do not hard-code a
 * relative path out of their own workspace.
 */
export const migrationsFolder = fileURLToPath(
	new URL("../drizzle", import.meta.url),
);

/**
 * Tenancy hardening applied after migrations (`pnpm --filter @pyra/db harden`).
 * Exported so integration-test setup can apply the same file the deploy job
 * does, rather than a second copy of the policies that could drift from it.
 */
export const tenancySqlPath = fileURLToPath(
	new URL("../sql/tenancy.sql", import.meta.url),
);
