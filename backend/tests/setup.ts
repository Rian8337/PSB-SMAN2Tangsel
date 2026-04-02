// Needed for tsyringe to work properly in tests
import { loadEnvironmentVariables } from "@/env";
import { EnvironmentVariableKey } from "@/types";
import { execSync } from "child_process";
import { createConnection } from "mysql2/promise";
import "reflect-metadata";
import {
    shouldManageTestDatabaseLifecycle,
    testDb,
    testDbManager,
    workerDbName,
} from "./utils";

loadEnvironmentVariables(true);

// Ensure all test code and migration commands target the same resolved database name.
process.env[EnvironmentVariableKey.databaseName] = workerDbName;

let setupHappened = false;
let rootConnection: Awaited<ReturnType<typeof createConnection>> | undefined;

beforeAll(async () => {
    if (setupHappened) {
        return;
    }

    setupHappened = true;

    if (shouldManageTestDatabaseLifecycle) {
        rootConnection = await createConnection({
            host: process.env[EnvironmentVariableKey.databaseHost],
            user: process.env[EnvironmentVariableKey.databaseUser],
            password: process.env[EnvironmentVariableKey.databasePassword],
            port: parseInt(
                process.env[EnvironmentVariableKey.databasePort] ?? "3306",
            ),
        });

        await rootConnection.query(
            `CREATE DATABASE IF NOT EXISTS \`${workerDbName}\``,
        );
    }

    execSync("pnpm push-db:test", {
        env: process.env,
        stdio: "ignore",
    });

    await testDbManager.cleanupAllTables();
    await testDbManager.seedPrimaryTables();
});

afterAll(async () => {
    testDb.$client.end();

    if (rootConnection) {
        await rootConnection.query(
            `DROP DATABASE IF EXISTS \`${workerDbName}\``,
        );

        await rootConnection.end();
    }
});
