import { MessageKey } from "@/i18n";
import { APIError } from "./APIError";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
 */
export class BadRequestError extends APIError {
    constructor(
        message: MessageKey = "http.badRequest",
        variables?: Record<string, string | number>,
    ) {
        super(message, variables, 400);
    }
}
