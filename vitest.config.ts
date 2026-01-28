import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: {
			// Obsidian API is external at runtime; tests use a local stub.
			obsidian: path.resolve(__dirname, "tests/mocks/obsidian.ts"),
		},
	},
	test: {
		include: ["tests/**/*.test.ts"],
		watch: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			exclude: ["node_modules/", "tests/"],
		},
	},
});
