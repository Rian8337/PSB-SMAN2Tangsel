import { APIError, SessionData, UnauthorizedError } from "@/types";
import { Request, Response } from "express";

/**
 * Base class for controllers.
 */
export abstract class BaseController {
    private static readonly unauthorizedError = new UnauthorizedError();

    /**
     * Handles errors thrown by controller methods and sends appropriate HTTP responses.
     *
     * @param req The request object.
     * @param res The response object to send the error response with.
     * @param error The error to handle.
     */
    protected handleError(
        req: Request<unknown>,
        res: Response<{ error: string }>,
        error: unknown,
    ) {
        if (error instanceof APIError) {
            res.status(error.statusCode).json({ error: req.t(error.key) });

            return;
        }

        console.error("[Unhandled Error]:", error);

        res.status(500).json({ error: req.t("http.serverError") });
    }

    /**
     * Verifies that a request has valid session data. If the session data is missing, a 401 Unauthorized response will be sent.
     *
     * @param req The request to verify the session data of.
     * @param res The response to send the 401 Unauthorized response with if the session data is missing.
     * @returns Whether the request has valid session data.
     */
    protected verifySession<
        TRequest extends Request<unknown, { error: string }>,
    >(
        req: TRequest,
        res: Response<{ error: string }>,
    ): req is TRequest & { readonly sessionData: SessionData } {
        if (!req.sessionData) {
            this.handleError(req, res, BaseController.unauthorizedError);
            return false;
        }

        return true;
    }
}
