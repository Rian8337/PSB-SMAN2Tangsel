import { MessageKey } from "@/i18n";
import { APIError } from "./APIError";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/409
 */
export class ConflictError extends APIError {
    constructor(message: MessageKey = "http.conflict") {
        super(message, 409);
    }
}
