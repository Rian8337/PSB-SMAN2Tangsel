import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { "@": "/src", "@test": "/tests" } },
    test: {
        include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/integration/**/*.test.{ts,tsx}",
            "tests/system/**/*.test.{ts,tsx}",
        ],
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
        maxWorkers: process.env.CI ? 1 : "25%",
        globals: true,
        silent: "passed-only",
        passWithNoTests: true,
        mockReset: true,
        reporters: [
            "default",
            ["html", { outputFile: "./html/index.html" }],
        ],
        coverage: {
            provider: "v8",
            include: ["src/**"],
            reporter: ["text", "lcov"],
            reportsDirectory: "./coverage",
        },
    },
});
