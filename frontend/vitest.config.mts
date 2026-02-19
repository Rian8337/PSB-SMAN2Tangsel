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
        silent: "passed-only",
        passWithNoTests: true,
        mockReset: true,
    },
});
