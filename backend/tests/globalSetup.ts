let setupHappened = false;
let teardownHappened = false;

export function setup() {
    if (setupHappened) {
        throw new Error("Setup called twice");
    }

    setupHappened = true;

    // await wipeTestDb();
    // await seedPrimaryTables();
}

export function teardown() {
    if (teardownHappened) {
        throw new Error("Teardown called twice");
    }

    teardownHappened = true;

    // await wipeTestDb();
    // db.$client.end();
}

// async function wipeTestDb() {
//     await cleanupSecondaryTables();
//     await cleanupPrimaryTables();
// }
