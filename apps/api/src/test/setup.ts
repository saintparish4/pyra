import "./env.js";

import { readFileSync } from "node:fs";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, migrationsFolder, tenancySqlPath } from "@pyra/db";

await migrate(db, { migrationsFolder });

// The same hardening the deploy job applies, so the isolation tests exercise
// the real policies rather than a second copy that could drift from them.
// FORCE ROW LEVEL SECURITY is what makes this meaningful here: tests connect as
// the owner, and without FORCE the owner would be exempt from its own policies.
await db.$client.unsafe(readFileSync(tenancySqlPath, "utf8")).simple();
