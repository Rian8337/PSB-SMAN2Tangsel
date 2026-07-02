import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "process";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./tests/e2e",
    forbidOnly: !!process.env.CI,
    workers: process.env.CI ? 1 : "25%",
    retries: process.env.CI ? 2 : 0,
    reporter: [["html", { open: "never" }]],
    use: {
        locale: "id-ID",
        trace: "on-first-retry",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ],
});
