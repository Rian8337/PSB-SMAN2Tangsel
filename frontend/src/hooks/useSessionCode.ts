"use client";

import { usePathname } from "@/i18n/navigation";

/**
 * Returns the `sessionCode` URL segment from the current `[sessionCode]` route.
 * `usePathname` from next-intl already strips the locale prefix, so the first
 * path segment is always the session code on session-scoped routes.
 */
export function useSessionCode(): string {
    const pathname = usePathname();

    return pathname.split("/")[1];
}
