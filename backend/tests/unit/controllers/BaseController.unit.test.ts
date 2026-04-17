import { BaseController } from "@/controllers/BaseController";
import { ApiRequest, ApiResponse, UnauthorizedError } from "@/types";
import { createMockRequestFactory, createMockResponse } from "@test/mocks";

class TestController extends BaseController {
    triggerError(req: ApiRequest<unknown>, res: ApiResponse, error: unknown) {
        this.handleError(req, res, error);
    }
}

describe("BaseController (unit)", () => {
    const controller = new TestController();
    const mockRequestFactory = createMockRequestFactory();

    let req: ReturnType<typeof mockRequestFactory>;
    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        req = mockRequestFactory({
            t: vi.fn().mockImplementation((key: string) => `translated_${key}`),
        });

        res = createMockResponse();
    });

    it("Translates and formats known APIErrors correctly", () => {
        const error = new UnauthorizedError("auth.invalidCredentials");

        controller.triggerError(req, res, error);

        expect(req.t).toHaveBeenCalledWith(
            "auth.invalidCredentials",
            undefined,
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "translated_auth.invalidCredentials",
        });
    });

    it("Falls back to a 500 status and generic message for unknown errors", () => {
        const error = new Error("Database connection dropped");
        const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => null);

        controller.triggerError(req, res, error);

        expect(consoleSpy).toHaveBeenCalledWith("[Unhandled Error]:", error);
        expect(req.t).toHaveBeenCalledWith("http.serverError");
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "translated_http.serverError",
        });
    });
});
