import { loadEnvFile } from "process";
import { testDbManager } from "./utils/db";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

export default async function globalSetup() {
    await testDbManager.cleanupAllTables();
    await testDbManager.seedPrimaryTables();
}
