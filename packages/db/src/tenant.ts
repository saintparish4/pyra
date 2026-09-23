import { sql } from "drizzle-orm";

import type { DepartmentId } from "@pyra/shared";

import { db } from "./client.js";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs `fn` with the department scope every row-level security policy reads.
 *
 * Setting `app.department_id` is the one step that must never be forgotten, so
 * it is the one step callers cannot take by hand. `set_config(..., true)` is
 * transaction-local: a pooled connection cannot carry one department's scope
 * into the next request, which a plain `SET` would.
 *
 * `set_config` takes the value as a bind parameter; `SET LOCAL` does not, and
 * would mean interpolating a tenant id into SQL text.
 */
export async function withTenant<T>(
	departmentId: DepartmentId,
	fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`select set_config('app.department_id', ${departmentId}, true)`);
		return fn(tx);
	});
}
