import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const obsidianStub = fileURLToPath(new URL("./tests/mocks/obsidian.ts", import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			{
				// Obsidian API is external at runtime; tests use a local stub.
				find: /^obsidian$/,
				replacement: obsidianStub,
			},
		],
	},
	test: {
		include: ["tests/**/*.test.ts"],
		watch: false,
		deps: {
			inline: ["obsidian"],
		},
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			exclude: ["node_modules/", "tests/"],
		},
	},
});
