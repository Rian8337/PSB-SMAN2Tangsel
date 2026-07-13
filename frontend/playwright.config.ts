import { defineConfig, devices } from "@playwright/test";
import { mkdtempSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { loadEnvFile } from "process";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

// Firefox refuses to launch under XDG_RUNTIME_DIR owned by a different user than the current
// process (e.g. WSL setups where $XDG_RUNTIME_DIR points at the host session's runtime dir, owned
// by the WSL user, while this process runs as root). When that mismatch is detected, fall back to
// a fresh directory this process actually owns instead of requiring a manual environment override.
if (process.platform !== "win32" && process.env.XDG_RUNTIME_DIR) {
    try {
        if (statSync(process.env.XDG_RUNTIME_DIR).uid !== process.getuid?.()) {
            process.env.XDG_RUNTIME_DIR = mkdtempSync(
                join(tmpdir(), "playwright-xdg-runtime-"),
            );
        }
    } catch {
        // XDG_RUNTIME_DIR doesn't exist or isn't accessible. Leave it as-is.
    }
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
