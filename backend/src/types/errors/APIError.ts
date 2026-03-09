import { MessageKey } from "@/i18n";

/**
 * A custom error to allow services to define HTTP status codes for controllers
 * to be returned to clients without breaking separation of concerns.
 */
export class APIError extends Error {
    constructor(
        /**
         * The message key of the error. This will be used by the controller to obtain
         * the localized message based on the locale of the request.
         */
        readonly key: MessageKey,

        /**
         * The HTTP status code that should be returned to the client. Defaults to 500.
         */
        readonly statusCode = 500,
    ) {
        super(key);

        this.name = this.constructor.name;
    }
}
