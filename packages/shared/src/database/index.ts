import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";

/**
 * Creates a new Drizzle database instance using the MySQL2 driver and the shared schema.
 *
 * @param config The MySQL connection configuration to use for creating the database connection pool.
 * @returns A Drizzle database instance typed with the shared schema.
 */
export function createDatabase(config: Parameters<typeof createPool>[0]) {
    return drizzle(createPool(config).pool, {
        casing: "snake_case",
        schema: schema,
        mode: "default",
    });
}
