// Needed for tsyringe to work properly in tests
import { loadEnvironmentVariables } from "@/env";
import { EnvironmentVariableKey } from "@/types";
import { execSync } from "child_process";
import { createConnection } from "mysql2/promise";
import "reflect-metadata";
import { testDb, testDbManager } from "./utils";

loadEnvironmentVariables(true);

const workerId = process.env.VITEST_POOL_ID ?? "1";
const baseDbName =
    process.env[EnvironmentVariableKey.databaseName] ?? "psb_sman2_test";

const workerDbName = `${baseDbName}_${workerId}`;

// Overwrite database name in environment variables to ensure that all code uses the correct test database for this worker.
process.env[EnvironmentVariableKey.databaseName] = workerDbName;

let setupHappened = false;
let rootConnection: Awaited<ReturnType<typeof createConnection>>;

beforeAll(async () => {
    if (setupHappened) {
        return;
    }

    setupHappened = true;

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

    execSync("pnpm push-db:test", {
        env: process.env,
        stdio: "ignore",
    });

    await testDbManager.cleanupAllTables();
    await testDbManager.seedPrimaryTables();
});

afterAll(async () => {
    testDb.$client.end();

    await rootConnection.query(`DROP DATABASE IF EXISTS \`${workerDbName}\``);
    await rootConnection.end();
});
