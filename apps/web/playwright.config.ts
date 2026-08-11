import { defineConfig } from "@playwright/test";

const webOrigin = process.env.E2E_WEB_ORIGIN ?? "http://localhost:5173";
const apiOrigin = process.env.E2E_API_ORIGIN ?? "http://localhost:3001";

export default defineConfig({
	testDir: "./e2e",
	// One worker, one file at a time: every spec signs in as the same seeded
	// admin, and better-auth rate-limits repeated sign-ins from one client.
	fullyParallel: false,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: webOrigin,
		trace: "on-first-retry",
	},
	// Both servers, because a sign-in crosses from the web app to the API. They
	// still need Postgres up and `pnpm --filter @pyra/api seed` already run.
	webServer: [
		{
			command: "pnpm --filter @pyra/api dev",
			url: `${apiOrigin}/health`,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
		{
			command: "pnpm --filter @pyra/web dev",
			url: webOrigin,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
	],
});
