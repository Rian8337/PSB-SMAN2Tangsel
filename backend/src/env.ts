import { config } from "dotenv";

/**
 * Loads environment variables from a `.env` file based on the current `NODE_ENV` value.
 */
export function loadEnvironmentVariables() {
    config({
        path: `.env.${process.env.NODE_ENV ?? "development"}`,
        quiet: true,
    });
}
