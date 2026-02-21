import { Injectable } from "@/decorators/injectable";
import { IConfigService } from "./IConfigService";
import { dependencyTokens } from "@/dependencies/tokens";
import { EnvironmentVariableKey } from "@/types";

/**
 * A service that is responsible for configuration-related operations.
 */
@Injectable(dependencyTokens.configService)
export class ConfigService implements IConfigService {
    getEnvironmentVariable(key: EnvironmentVariableKey): string | undefined;
    getEnvironmentVariable(key: EnvironmentVariableKey, required: true): string;
    getEnvironmentVariable(
        key: EnvironmentVariableKey,
        required?: boolean,
    ): string | undefined {
        const value = process.env[key];

        if (required && value === undefined) {
            throw new Error(
                `Environment variable ${key} is required but not set.`,
            );
        }

        return value;
    }
}
