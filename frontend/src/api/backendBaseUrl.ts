function normalizeBrowserApiBaseUrl(url: string): string {
    try {
        const parsedUrl = new URL(url);
        const currentHost = window.location.hostname;

        const isLoopbackHost =
            parsedUrl.hostname === "localhost" ||
            parsedUrl.hostname === "127.0.0.1";

        const isCurrentLoopbackHost =
            currentHost === "localhost" || currentHost === "127.0.0.1";

        if (
            isLoopbackHost &&
            isCurrentLoopbackHost &&
            parsedUrl.hostname !== currentHost
        ) {
            parsedUrl.hostname = currentHost;
        }

        return parsedUrl.toString().replace(/\/$/, "");
    } catch {
        return url;
    }
}

/**
 * Returns the base URL of the backend server.
 *
 * Resolution order:
 * - **Browser**: `window.__API_BASE_URL__` (injected at runtime by the server) →
 *   `NEXT_PUBLIC_API_URL` → `http://127.0.0.1:3001`. The result is normalized so
 *   that `localhost` and `127.0.0.1` are treated as the same loopback host, matching
 *   whichever alias the browser used to load the page.
 * - **Server**: `API_BASE_URL` → `NEXT_PUBLIC_API_URL` → `http://127.0.0.1:3001`.
 */
export function getBackendBaseUrl(): string {
    const fallback = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

    if (typeof window !== "undefined") {
        const runtimeCandidate = (globalThis as Record<string, unknown>)
            .__API_BASE_URL__;

        const runtimeUrl =
            typeof runtimeCandidate === "string" ? runtimeCandidate : undefined;

        return normalizeBrowserApiBaseUrl(runtimeUrl ?? fallback);
    }

    return process.env.API_BASE_URL ?? fallback;
}

/**
 * The base URL of the backend server, resolved once at module load time.
 *
 * Use this for static values such as `<a href>` download links. For contexts where
 * the URL must reflect the latest runtime state, call {@link getBackendBaseUrl} directly.
 */
export const backendBaseUrl = getBackendBaseUrl();
