/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401
 */
export class UnauthorizedError extends Error {
    constructor(message = "Unauthorized", options?: ErrorOptions) {
        super(message, options);

        this.name = "UnauthorizedError";
    }
}
