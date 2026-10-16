import { defineConfig } from "vitest/config";
import { variantReporters } from "@blzsky/variant/vitest";

export default defineConfig({
	test: {
		reporters: variantReporters(),
		include: ["src/**/*.integration.test.ts"],
		setupFiles: ["./src/test/setup.ts"],
		// One database, one schema: parallel files would truncate each other's rows.
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
});
