import { EnvironmentVariableKey } from "@/types";
import { createDatabase } from "@psb/shared/database";
import { createDatabaseSeeder } from "@psb/shared/tests";
import { loadEnvironmentVariables } from "@/env";

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
 * A database seeder for the test database, used to manage test data during testing.
 */
export const testDbManager = createDatabaseSeeder(testDb);

/**
 * The seeders from the test database manager, which can be used to seed data in the
 * database during testing.
 */
export const { seeders } = testDbManager;
