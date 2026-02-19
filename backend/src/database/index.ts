import { config } from "dotenv";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

/**
 * The database connection.
 */
export const db = drizzle<typeof schema>(
    createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT ?? "3306"),
    }).pool,
    { casing: "snake_case", schema: schema, mode: "default" },
);

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = MySql2Database<typeof schema>;
