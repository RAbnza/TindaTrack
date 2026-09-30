import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],

    // All integration tests currently share one PostgreSQL test DB.
    // Keep test files serial until we deliberately isolate databases.
    fileParallelism: false,
  },
});