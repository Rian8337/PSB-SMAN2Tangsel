import { createDatabase } from "@psb/shared/database";
import { createDatabaseManager } from "@psb/shared/tests";
import { loadEnvFile } from "process";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

/**
 * A Drizzle database instance for testing purposes, connected to the test database.
 */
export const testDb = createDatabase({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT ?? "3306"),
});

/**
 * A database manager for the test database, used to manage test data during testing.
 */
export const testDbManager = createDatabaseManager(testDb);

export const { seeders } = testDbManager;
