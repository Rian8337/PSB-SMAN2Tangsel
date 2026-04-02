import { createDatabase } from "@psb/shared/database";
import { createDatabaseManager } from "@psb/shared/tests";
import { loadEnvFile } from "process";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

/**
 * Creates a database manager for the given database name.
 *
 * This is useful for creating database managers for multiple test databases when running tests in parallel.
 *
 * @param dbName The name of the database to create the manager for.
 * @returns A database manager connected to the specified database.
 */
export function createTestDatabaseManager(dbName: string) {
    return createDatabaseManager(
        createDatabase({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,
            port: parseInt(process.env.DB_PORT ?? "3306"),
        }),
    );
}
