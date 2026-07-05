import { getContainer } from "@/dependencies/container";
import { dependencyTokens } from "@/dependencies/tokens";
import { EnvironmentVariableKey } from "@/types";
import { createDatabase as createNewDatabase } from "@psb/shared/database";

/**
 * Creates a new Drizzle database instance using the MySQL2 driver and the shared schema.
 * The database connection parameters are read from environment variables.
 *
 * @param container The dependency container to resolve services from. If not provided,
 * the default container will be used.
 * @returns A Drizzle database instance typed with the shared schema.
 */
export function createDatabase(container = getContainer()) {
    const configService = container.resolve(dependencyTokens.configService);

    return createNewDatabase({
        host: configService.getEnvironmentVariable(
            EnvironmentVariableKey.DatabaseHost,
        ),
        user: configService.getEnvironmentVariable(
            EnvironmentVariableKey.DatabaseUser,
        ),
        password: configService.getEnvironmentVariable(
            EnvironmentVariableKey.DatabasePassword,
        ),
        database: configService.getEnvironmentVariable(
            EnvironmentVariableKey.DatabaseName,
        ),
        port: parseInt(
            configService.getEnvironmentVariable(
                EnvironmentVariableKey.DatabasePort,
            ) ?? "3306",
        ),
        timezone: "+00:00",
    });
}
