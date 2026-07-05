import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import formData from "express-form-data";
import { DependencyContainer } from "tsyringe";
import { getContainer } from "./dependencies/container";
import { dependencyTokens } from "./dependencies/tokens";
import { i18nMiddleware } from "./i18n";
import { createRouter } from "./router";
import { EnvironmentVariableKey } from "./types";
import helmet from "helmet";

function getAllowedCorsOrigins(container: DependencyContainer) {
    const configService = container.resolve(dependencyTokens.configService);
    const defaultOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

    const additionalOrigins = (
        configService.getEnvironmentVariable(
            EnvironmentVariableKey.CorsOrigins,
        ) ?? ""
    )
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

    return new Set([...defaultOrigins, ...additionalOrigins]);
}

/**
 * Creates an Express application with all necessary middleware and routes configured.
 *
 * This function sets up middleware for JSON parsing, URL-encoded data parsing, cookie parsing, form data
 * handling, CORS, and internationalization. It also registers all routes defined in the controllers.
 *
 * @param container The dependency injection container to use for resolving services. If not provided, the default
 * container will be used.
 * @returns The configured Express application.
 * @throws If any controller is missing a base path or if there are issues with route definitions.
 */
export function createApp(container = getContainer()) {
    const app = express();
    const allowedOrigins = getAllowedCorsOrigins(container);
    const configService = container.resolve(dependencyTokens.configService);

    app.set("trust proxy", 1)
        .use(helmet())
        .use(express.json())
        .use(express.urlencoded({ extended: true }))
        .use(
            cookieParser(
                configService.getEnvironmentVariable(
                    EnvironmentVariableKey.CookieSecret,
                ),
            ),
        )
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
                origin: (origin, callback) => {
                    if (!origin || allowedOrigins.has(origin)) {
                        callback(null, true);

                        return;
                    }

                    callback(new Error(`CORS origin not allowed: ${origin}`));
                },
                credentials: true,
            }),
        )
        .use(i18nMiddleware)
        .use(createRouter());

    return app;
}
