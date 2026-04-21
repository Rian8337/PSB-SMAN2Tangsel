import { APIError, ApiRequest, ApiResponse, UnauthorizedError } from "@/types";
import { SessionData } from "@psb/shared/types";

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
    protected handleError<Params, ResBody, ReqBody, ReqQuery>(
        req: ApiRequest<Params, ResBody, ReqBody, ReqQuery>,
        res: ApiResponse<ResBody>,
        error: unknown,
    ) {
        if (error instanceof APIError) {
            res.status(error.statusCode).json({
                error: req.t(error.key, error.variables),
            });

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
        Params,
        ResBody,
        ReqBody,
        ReqQuery,
        TRequest extends ApiRequest<Params, ResBody, ReqBody, ReqQuery>,
    >(
        req: TRequest,
        res: ApiResponse<ResBody>,
    ): req is TRequest & { readonly sessionData: SessionData } {
        if (!req.sessionData) {
            this.handleError(req, res, BaseController.unauthorizedError);
            return false;
        }

        return true;
    }
}
