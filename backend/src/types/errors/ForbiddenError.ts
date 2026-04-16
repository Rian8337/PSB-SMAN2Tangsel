import { MessageKey } from "@/i18n";
import { APIError } from "./APIError";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403
 */
export class ForbiddenError extends APIError {
    constructor(
        key: MessageKey = "http.forbidden",
        variables?: Record<string, string | number>,
    ) {
        super(key, variables, 403);
    }
}
