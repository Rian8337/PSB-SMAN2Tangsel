import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import formData from "express-form-data";
import { getContainer } from "./dependencies/container";
import { dependencyTokens } from "./dependencies/tokens";
import { createRouter } from "./router";
import { EnvironmentVariableKey } from "./types";

/**
 * Creates an Express application with all necessary middleware and routes configured.
 */
export function createApp() {
    const app = express();

    app.use(express.json())
        .use(express.urlencoded({ extended: true }))
        .use(cookieParser(process.env.COOKIE_SECRET))
        .use(
            formData.parse({
                autoClean: true,
                // Limit file sizes to 100MB
                maxFilesSize: 100 * 1024 * 1024,
            }),
        )
        .use(formData.format())
        .use(formData.union())
        .use(
            cors({
                origin: "http://localhost:3000",
                credentials: true,
            }),
        )
        .use(createRouter());

    return app;
}

/**
 * Loads environment variables from a `.env` file based on the current `NODE_ENV` value.
 */
export function loadEnvironmentVariables() {
    const configService = getContainer().resolve(
        dependencyTokens.configService,
    );

    config({
        path: `.env.${configService.getEnvironmentVariable(EnvironmentVariableKey.nodeEnv) ?? "development"}`,
        quiet: true,
    });
}
