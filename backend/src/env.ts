import { loadEnvFile } from "process";

/**
 * Loads environment variables from a `.env` file based on the current `NODE_ENV` value.
 */
export function loadEnvironmentVariables() {
    loadEnvFile(`.env.${process.env.NODE_ENV ?? "development"}`);
}
