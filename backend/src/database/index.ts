import { getContainer } from "@/dependencies/container";
import { dependencyTokens } from "@/dependencies/tokens";
import { EnvironmentVariableKey } from "@/types";
import * as schema from "@psb/shared/schema";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

/**
 * Creates a new Drizzle database instance using the MySQL2 driver and the shared schema.
 * The database connection parameters are read from environment variables.
 *
 * @returns A Drizzle database instance typed with the shared schema.
 */
export function createDatabase() {
    const configService = getContainer().resolve(
        dependencyTokens.configService,
    );

    const pool = createPool({
        host: configService.getEnvironmentVariable(
            EnvironmentVariableKey.databaseHost,
        ),
        user: configService.getEnvironmentVariable(
            EnvironmentVariableKey.databaseUser,
        ),
        password: configService.getEnvironmentVariable(
            EnvironmentVariableKey.databasePassword,
        ),
        database: configService.getEnvironmentVariable(
            EnvironmentVariableKey.databaseName,
        ),
        port: parseInt(
            configService.getEnvironmentVariable(
                EnvironmentVariableKey.databasePort,
            ) ?? "3306",
        ),
    });

    return drizzle(pool.pool, {
        casing: "snake_case",
        schema: schema,
        mode: "default",
    });
}

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = MySql2Database<typeof schema>;
