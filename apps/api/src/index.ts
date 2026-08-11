import "./env.js";

import { buildApp } from "./app.js";
import { startJobs } from "./jobs/boss.js";

const app = await buildApp();

try {
	app.log.info("starting job queue");
	await startJobs();
	app.log.info("job queue started");
	await app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
} catch (error) {
	app.log.error({ err: error }, "startup failed");
	process.exit(1);
}
