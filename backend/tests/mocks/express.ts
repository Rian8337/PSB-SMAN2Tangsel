import { Request, Response } from "express";

interface ParamsDictionary {
    [key: string]: string | string[];
    [key: number]: string;
}

/**
 * Creates a factory to create mock request objects for testing with Express.js.
 *
 * @returns A factory to create mock request objects with default values and the provided overrides.
 */
export function createMockRequestFactory<
    TParams = ParamsDictionary,
    TResponse = unknown,
    TBody extends Record<string, unknown> = Record<string, unknown>,
    TQuery extends Record<string, string> = Record<string, string>,
>() {
    type Req = Request<TParams, TResponse, TBody, TQuery>;

    /**
     * Creates a mock request object with default values and the provided overrides.
     *
     * **Do not reuse this mock across tests.**
     *
     * @param overrides Partial overrides for the request object.
     * @returns A mock request object with default values and the provided overrides.
     */
    return <const TOverrides extends Partial<Req>>(
        overrides: TOverrides = {} as TOverrides,
    ) => {
        const mock = {
            params: {} as TParams,
            query: {} as TQuery,
            body: {} as TBody,
            signedCookies: {},
            t: vi.fn<Req["t"]>((key) => key),
            acceptsLanguages: vi.fn<Req["acceptsLanguages"]>(),
            ...overrides,
        } satisfies Partial<Req>;

        return mock as Req & typeof mock & TOverrides;
    };
}

/**
 * Creates a mock response object for testing with Express.js.
 *
 * **Do not reuse this mock across tests.**
 */
export function createMockResponse<TResponse = unknown>() {
    type Res = Response<TResponse>;

    const mock = {
        cookie: vi.fn<Res["cookie"]>().mockReturnThis(),
        clearCookie: vi.fn<Res["clearCookie"]>().mockReturnThis(),
        status: vi.fn<Res["status"]>().mockReturnThis(),
        setHeader: vi.fn<Res["setHeader"]>().mockReturnThis(),
        send: vi.fn<Res["send"]>().mockReturnThis(),
        sendStatus: vi.fn<Res["sendStatus"]>().mockReturnThis(),
        json: vi.fn<Res["json"]>().mockReturnThis(),
    } satisfies Partial<Res>;

    return mock as Res & typeof mock;
}
