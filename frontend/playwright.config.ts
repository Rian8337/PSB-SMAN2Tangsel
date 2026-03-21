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
    globalSetup: "./tests/e2e/global-setup.ts",
    globalTeardown: "./tests/e2e/global-teardown.ts",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: "html",
    use: {
        baseURL: "http://127.0.0.1:3000",
        locale: "id-ID",
        trace: "on-first-retry",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ],
    webServer: {
        command: process.env.CI
            ? "cd .. && pnpm start"
            : "cd .. && pnpm build && pnpm start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: "pipe",
        env: {
            NODE_ENV: "production",
            CI: process.env.CI!,
            // Explicitly pass database environment variables to ensure that the test database is used instead.
            DB_HOST: process.env.DB_HOST!,
            DB_PORT: process.env.DB_PORT!,
            DB_USER: process.env.DB_USER!,
            DB_PASSWORD: process.env.DB_PASSWORD!,
            DB_NAME: process.env.DB_NAME!,
            IS_E2E_TEST: "true",
        },
    },
});
