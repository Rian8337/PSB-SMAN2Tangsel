import { EnvironmentVariableKey } from "@/types";

/**
 * A service that is responsible for configuration-related operations.
 */
export interface IConfigService {
    /**
     * Obtains an environment variable by its key.
     *
     * @param key The key of the environment variable.
     * @param required Whether the environment variable is required. If `true` and the variable is not found, an error will be thrown.
     * @returns The value of the environment variable, or `undefined` if it does not exist.
     */
    getEnvironmentVariable(
        key: EnvironmentVariableKey,
        required?: boolean,
    ): string | undefined;

    /**
     * Obtains an environment variable by its key, throwing an error if it is not found.
     *
     * @param key The key of the environment variable.
     * @param required Whether the environment variable is required. If `true` and the variable is not found, an error will be thrown.
     * @returns The value of the environment variable.
     */
    getEnvironmentVariable(key: EnvironmentVariableKey, required: true): string;
}
