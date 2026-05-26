import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: { alias: { "@": "/src", "@test": "/tests" } },
    test: {
        include: [
            "tests/unit/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/system/**/*.test.ts",
        ],
        globals: true,
        setupFiles: "./tests/setup.ts",
        maxWorkers: process.env.CI ? 1 : undefined,
        hookTimeout: 30000,
        silent: "passed-only",
        passWithNoTests: true,
        mockReset: true,
        reporters: [
            "default",
            ["html", { outputFile: "./html/test-results.html" }],
        ],
    },
});
