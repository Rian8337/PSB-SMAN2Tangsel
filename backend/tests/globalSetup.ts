import { testDb, testDbManager } from "./utils";

let setupHappened = false;
let teardownHappened = false;

export async function setup() {
    if (setupHappened) {
        throw new Error("Setup called twice");
    }

    setupHappened = true;

    await wipeTestDb();
    await testDbManager.seedPrimaryTables();
}

export async function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;

    await wipeTestDb();
    testDb.$client.end();
}

async function wipeTestDb() {
    await testDbManager.cleanupSecondaryTables();
    await testDbManager.cleanupPrimaryTables();
}
