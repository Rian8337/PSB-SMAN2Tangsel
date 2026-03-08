import { routing } from "@/i18n/routing";
import { APIError } from "./APIError";

/**
 * Base API client class that provides methods for making HTTP requests to the backend server.
 */
export abstract class APIClient {
    /**
     * The base URL of the backend server. All API requests will be made to this URL.
     */
    protected get baseURL(): string {
        return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    }

    constructor(
        /**
         * The locale to be used in API requests.
         */
        protected readonly locale: (typeof routing.locales)[number] = "id",
    ) {}

    /**
     * Performs a GET request to the specified endpoint with the given options.
     *
     * @param endpoint The endpoint to which the request will be made.
     * @param options Optional request options such as headers, body, etc. Headers will be automatically
     * set to use `credentials: "include"`.
     * @returns The response of the request.
     */
    protected get(endpoint: string | URL | RequestInfo, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: "GET" });
    }

    /**
     * Performs a POST request to the specified endpoint with the given options.
     *
     * @param endpoint The endpoint to which the request will be made.
     * @param options Optional request options such as headers, body, etc. Headers will be automatically
     * set to use `credentials: "include"`.
     * @returns The response of the request.
     */
    protected post(
        endpoint: string | URL | RequestInfo,
        options?: RequestInit,
    ) {
        return this.request(endpoint, { ...options, method: "POST" });
    }

    /**
     * Performs a PUT request to the specified endpoint with the given options.
     *
     * @param endpoint The endpoint to which the request will be made.
     * @param options Optional request options such as headers, body, etc. Headers will be automatically
     * set to use `credentials: "include"`.
     * @return The response of the request.
     */
    protected put(endpoint: string | URL | RequestInfo, options?: RequestInit) {
        return this.request(endpoint, { ...options, method: "PUT" });
    }

    /**
     * Performs a DELETE request to the specified endpoint with the given options.
     *
     * @param endpoint The endpoint to which the request will be made.
     * @param options Optional request options such as headers, body, etc. Headers will be automatically
     * set to use `credentials: "include"`.
     * @returns The response of the request.
     */
    protected delete(
        endpoint: string | URL | RequestInfo,
        options?: RequestInit,
    ) {
        return this.request(endpoint, { ...options, method: "DELETE" });
    }

    private async request(
        endpoint: string | URL | RequestInfo,
        options?: RequestInit,
    ) {
        const urlStr =
            endpoint instanceof Request ? endpoint.url : endpoint.toString();

        const finalUrl = urlStr.startsWith("http")
            ? urlStr
            : `${this.baseURL.replace(/\/$/, "")}/${urlStr.replace(/^\//, "")}`;

        const res = await fetch(finalUrl, {
            ...options,
            headers: Object.assign(options?.headers ?? {}, {
                "Accept-Language": this.locale,
            }),
            credentials: "include",
        });

        if (!res.ok) {
            const clonedRes = res.clone();

            // Try to read the error in JSON first, then text.
            try {
                const data = (await res.json()) as { error?: string };

                throw new APIError(
                    res.status,
                    data.error ?? JSON.stringify(data),
                );
            } catch (e) {
                if (e instanceof APIError) {
                    throw e;
                }

                throw new APIError(res.status, await clonedRes.text());
            }
        }

        return res;
    }
}
