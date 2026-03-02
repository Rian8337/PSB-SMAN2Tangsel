/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404
 */
export class NotFoundError extends Error {
    constructor(message = "Not Found", options?: ErrorOptions) {
        super(message, options);

        this.name = "NotFoundError";
    }
}
