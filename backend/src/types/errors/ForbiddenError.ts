/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403
 */
export class ForbiddenError extends Error {
    constructor(message = "Forbidden", options?: ErrorOptions) {
        super(message, options);

        this.name = "ForbiddenError";
    }
}
