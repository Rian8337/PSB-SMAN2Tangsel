import { defineConfig } from "drizzle-kit";
import { loadEnvFile } from "process";

loadEnvFile(`.env.${process.env.NODE_ENV ?? "development"}`)

export default defineConfig({
    dialect: "mysql",
    out: "./drizzle",
    schema: "../packages/shared/src/database/schema",
    strict: true,
    dbCredentials: {
        host: process.env.DB_HOST!,
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        port: Number(process.env.DB_PORT!) || 3306,
    },
});
