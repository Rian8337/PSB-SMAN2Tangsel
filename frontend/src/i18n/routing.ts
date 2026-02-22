import { defineRouting } from "next-intl/routing";

/**
 * Routing configuration for next-intl. This is used to define the supported locales and the default locale.
 */
export const routing = defineRouting({
    locales: ["en", "id"],
    defaultLocale: "id",
    localePrefix: "as-needed",
    localeDetection: false,
});
