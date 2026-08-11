import "./env.js";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db, migrationsFolder } from "@pyra/db";

await migrate(db, { migrationsFolder });
