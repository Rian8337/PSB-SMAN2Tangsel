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

    req.t = (path, variables) => {
        let message = path
            .split(".")
            .reduce(
                (acc: unknown, part) =>
                    (acc as Record<string, unknown> | undefined)?.[part],
                messages[locale],
            ) as string | undefined;

        if (!message) {
            console.warn(
                `[i18n] Missing translation for key "${path}" in locale "${locale}".`,
            );

            return path;
        }

        if (variables) {
            message = message.replace(/\{([^}]+)\}/g, (match, key: string) => {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                return variables[key] !== undefined
                    ? String(variables[key])
                    : match;
            });
        }

        return message;
    };

    next();
}
