import { ApiErrorBody } from "@psb/shared/types";
import type { Request, Response } from "express";

interface ParamsDictionary {
    [key: string]: string | string[];
    [key: number]: string;
}

/**
 * Wraps the Express {@link Request} type to ensure all API requests conform to a standard structure, including error handling.
 */
export type ApiRequest<
    Params = ParamsDictionary,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Record<string, string>,
> = Request<Params, ResBody | ApiErrorBody, ReqBody, ReqQuery>;

/**
 * Wraps the Express {@link Response} type to ensure all API responses conform to a standard structure, including error handling.
 */
export type ApiResponse<ResBody = unknown> = Response<ResBody | ApiErrorBody>;
