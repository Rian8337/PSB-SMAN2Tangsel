import { testDb, testDbManager } from "./utils";

let setupHappened = false;
let teardownHappened = false;

export async function setup() {
    if (setupHappened) {
        throw new Error("Setup called twice");
    }

    setupHappened = true;

    await testDbManager.cleanupAllTables();
    await testDbManager.seedPrimaryTables();
}

export async function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;

    await testDbManager.cleanupAllTables();
    testDb.$client.end();
}
