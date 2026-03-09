import { APIError } from "@/types";
import { Request, Response } from "express";

/**
 * Base class for controllers.
 */
export abstract class BaseController {
    /**
     * Handles errors thrown by controller methods and sends appropriate HTTP responses.
     *
     * @param req The request object.
     * @param res The response object to send the error response with.
     * @param error The error to handle.
     */
    protected handleError(
        req: Request<unknown, unknown>,
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
}
