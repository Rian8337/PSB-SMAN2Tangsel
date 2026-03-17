import { loadEnvironmentVariables } from "@/env";
import { EnvironmentVariableKey } from "@/types";
import { createDatabase } from "@psb/shared/database";
import { createDatabaseManager } from "@psb/shared/tests";

loadEnvironmentVariables(true);

/**
 * A Drizzle database instance for testing purposes, connected to the test database.
 */
export const testDb = createDatabase({
    host: process.env[EnvironmentVariableKey.databaseHost],
    user: process.env[EnvironmentVariableKey.databaseUser],
    password: process.env[EnvironmentVariableKey.databasePassword],
    database: process.env[EnvironmentVariableKey.databaseName],
    port: parseInt(process.env[EnvironmentVariableKey.databasePort] ?? "3306"),
});

/**
 * A database manager for the test database, used to manage test data during testing.
 */
export const testDbManager = createDatabaseManager(testDb);

export const { seeders } = testDbManager;
