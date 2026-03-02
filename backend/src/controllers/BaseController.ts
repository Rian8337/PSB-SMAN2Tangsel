import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/types";
import { Response } from "express";

/**
 * Base class for controllers.
 */
export abstract class BaseController {
    /**
     * Handles errors thrown by controller methods and sends appropriate HTTP responses.
     *
     * @param res The response object to send the error response with.
     * @param error The error to handle.
     */
    protected handleError(res: Response<{ error: string }>, error: unknown) {
        if (error instanceof Error) {
            let statusCode: number;

            switch (true) {
                case error instanceof UnauthorizedError:
                    statusCode = 401;
                    break;

                case error instanceof ForbiddenError:
                    statusCode = 403;
                    break;

                case error instanceof NotFoundError:
                    statusCode = 404;
                    break;

                default:
                    statusCode = 500;
            }

            res.status(statusCode).json({ error: error.message });
        }
    }
}
