import { EnvironmentVariableKey } from "@/types";

/**
 * A service that is responsible for configuration-related operations.
 */
export interface IConfigService {
    /**
     * Obtains an environment variable by its key.
     *
     * @param key The key of the environment variable.
     * @returns The value of the environment variable, or `undefined` if it does not exist.
     */
    getEnvironmentVariable(key: EnvironmentVariableKey): string | undefined;
}
