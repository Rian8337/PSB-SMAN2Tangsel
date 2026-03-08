/**
 * An error that is thrown from a failing API request.
 */
export class APIError extends Error {
    constructor(
        /**
         * The status code returned by the server.
         */
        readonly code: number,

        /**
         * A descriptive message of the error.
         */
        message?: string,

        /**
         * Options for the error.
         */
        options?: ErrorOptions,
    ) {
        super(message, options);

        this.name = "APIError";
    }
}
