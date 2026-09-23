import { PgBoss } from "pg-boss";

// The runtime role, matching @pyra/db. pg-boss creates its own tables on
// start, so `harden` gives pyra_app ownership of the `pgboss` schema rather
// than CREATE on public.
const connectionString = process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("neither APP_DATABASE_URL nor DATABASE_URL is set");
}

export const boss = new PgBoss(connectionString);

export async function startJobs() {
	await boss.start();
	// register queues later: neris.submit, import.process
}
