import { testDbManager } from "./utils/db";

export default async function globalTeardown() {
    await testDbManager.cleanupAllTables();
}
