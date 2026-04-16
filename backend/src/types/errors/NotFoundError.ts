import { MessageKey } from "@/i18n";
import { APIError } from "./APIError";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404
 */
export class NotFoundError extends APIError {
    constructor(
        key: MessageKey = "http.notFound",
        variables?: Record<string, string | number>,
    ) {
        super(key, variables, 404);
    }
}
