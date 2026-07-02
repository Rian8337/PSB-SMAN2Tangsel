import { loadEnvironmentVariables } from "@/env";
import { EnvironmentVariableKey } from "@/types";
import { createDatabase } from "@psb/shared/database";
import { createDatabaseManager } from "@psb/shared/tests";

loadEnvironmentVariables(true);

function readBooleanEnv(name: string, fallback: boolean) {
    const value = process.env[name];

    if (value == null) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();

    return normalized === "1" || normalized === "true";
}

const workerId = process.env.VITEST_POOL_ID ?? "1";
const baseDbName =
    process.env[EnvironmentVariableKey.databaseName] ?? "psb_sman2_test";

const shouldUseWorkerDatabase = readBooleanEnv(
    "TEST_DB_PER_WORKER",
    !process.env.CI,
);

/**
 * Whether the test setup should manage the lifecycle of the test database, including creating and dropping it
 * for each worker.
 *
 * This should be enabled when running tests in parallel to ensure that each worker has its own isolated
 * database, but can be disabled when running tests sequentially to speed up test setup and teardown.
 */
export const shouldManageTestDatabaseLifecycle = readBooleanEnv(
    "TEST_DB_MANAGE_LIFECYCLE",
    shouldUseWorkerDatabase,
);

/**
 * The name of the test database to use for this worker. If `TEST_DB_PER_WORKER` is enabled, this will be a unique
 * name based on the worker ID, otherwise it will be the same as the base database name.
 */
export const workerDbName = shouldUseWorkerDatabase
    ? `${baseDbName}_${workerId}`
    : baseDbName;

/**
 * A Drizzle database instance for testing purposes, connected to the test database.
 */
export const testDb = createDatabase({
    host: process.env[EnvironmentVariableKey.databaseHost],
    user: process.env[EnvironmentVariableKey.databaseUser],
    password: process.env[EnvironmentVariableKey.databasePassword],
    database: workerDbName,
    port: parseInt(process.env[EnvironmentVariableKey.databasePort] ?? "3306"),
    timezone: "+00:00",
});

/**
 * A database manager for the test database, used to manage test data during testing.
 */
export const testDbManager = createDatabaseManager(testDb);

export const { seeders } = testDbManager;
