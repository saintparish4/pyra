import { defineConfig } from "antiscaler";

export default defineConfig({
  strategy: "adaptive",
  tasks: {
    build: {
      command: "pnpm build",
      inputs: ["src/**/*", "package.json"],
    },
    lint: {
      command: "pnpm lint",
      inputs: ["src/**/*", "*.config.*"],
    },
    test: {
      command: "pnpm test",
      inputs: ["src/**/*", "**/__tests__/**/*"],
    },
    typecheck: {
      command: "pnpm typecheck",
      inputs: ["src/**/*", "tsconfig*.json"],
    },
  },
});
