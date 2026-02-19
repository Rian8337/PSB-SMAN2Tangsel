import cors from "cors";
import cookieParser from "cookie-parser";
import formData from "express-form-data";
import express from "express";
import { createRouter } from "./router";

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
