const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Formats a timestamp for display in a notification feed.
 *
 * Timestamps less than a minute old are shown as "just now". Timestamps less
 * than a day old are shown as a locale-aware relative time (e.g. "5 minutes
 * ago"). Older timestamps fall back to an absolute local date and time, since
 * relative phrasing stops being useful (and gets long) beyond a day.
 */
export function formatNotificationDate(
    timestamp: number,
    locale: string,
    now = Date.now(),
): string {
    const diffMs = now - timestamp;

    if (diffMs < MINUTE_MS) {
        return new Intl.RelativeTimeFormat(locale, {
            numeric: "auto",
        }).format(0, "second");
    }

    if (diffMs < HOUR_MS) {
        const minutes = Math.round(diffMs / MINUTE_MS);

        return new Intl.RelativeTimeFormat(locale, {
            numeric: "auto",
        }).format(-minutes, "minute");
    }

    if (diffMs < DAY_MS) {
        const hours = Math.round(diffMs / HOUR_MS);

        return new Intl.RelativeTimeFormat(locale, {
            numeric: "auto",
        }).format(-hours, "hour");
    }

    return new Date(timestamp).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}
