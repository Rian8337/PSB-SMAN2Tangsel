import { createDatabase } from "@psb/shared/database";
import { seedPrimaryTables } from "@psb/shared/tests";
import { loadEnvFile } from "process";

// ALWAYS use test environment variables to avoid tinkering production or development databases.
if (!process.env.CI) {
    loadEnvFile(".env.test");
}

export default function globalSetup() {
    const db = createDatabase({
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        port: parseInt(process.env.DB_PORT ?? "3306"),
    });

    try {
        seedPrimaryTables(db);
    } catch (e) {
        console.error("Error seeding primary tables:", e);
        throw e;
    } finally {
        db.$client.end();
    }
}
