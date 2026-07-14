import { PgBoss } from "pg-boss";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const boss = new PgBoss(connectionString);

export async function startJobs() {
  await boss.start();
  // register queues later: neris.submit, import.process
}
