import { MessageKey } from "@/i18n";
import { APIError } from "./APIError";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401
 */
export class UnauthorizedError extends APIError {
    constructor(key: MessageKey = "http.unauthorized") {
        super(key, 404);
    }
}
