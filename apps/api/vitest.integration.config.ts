import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.integration.test.ts"],
		setupFiles: ["./src/test/setup.ts"],
		// One database, one schema: parallel files would truncate each other's rows.
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
