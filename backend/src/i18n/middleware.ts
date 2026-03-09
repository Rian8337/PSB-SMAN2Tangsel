import { NextFunction, Request, Response } from "express";
import { Locale, messages } from "./messages";

/**
 * Middleware for parsing request locales.
 */
export function i18nMiddleware(
    req: Request<unknown>,
    res: Response<unknown>,
    next: NextFunction,
) {
    const preferredLocale = req.acceptsLanguages(["id", "en"]);
    const locale: Locale = preferredLocale === "en" ? "en" : "id";

    req.locale = locale;

    req.t = (path) =>
        path
            .split(".")
            .reduce(
                (acc: unknown, part) => (acc as Record<string, unknown>)[part],
                messages[locale],
            ) as string;

    next();
}
