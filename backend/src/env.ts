import { loadEnvFile } from "process";

/**
 * Loads environment variables from a `.env` file based on the current `NODE_ENV` value.
 *
 * If this is called in a Continuous Integration environment, no file will be loaded.
 */
export function loadEnvironmentVariables() {
    if (!process.env.CI) {
        const nodeEnv = process.env.NODE_ENV ?? "development";

        try {
            loadEnvFile(`.env.${nodeEnv}`);
        } catch {
            // Gracefully ignore missing files so the server can boot using OS variables
            console.warn(
                `[Env] No .env.${nodeEnv} file found. Relying on system environment variables.`,
            );
        }
    }
}
