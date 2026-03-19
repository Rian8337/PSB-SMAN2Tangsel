import { AuthController } from "@/controllers";
import { LoginResponseBody } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockAuthService,
    mockUserService,
} from "@test/mocks";

describe("AuthController (unit)", () => {
    const controller = new AuthController(mockAuthService, mockUserService);
    let mockResponse: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        mockResponse = createMockResponse();
    });

    describe("login", () => {
        const createMockRequest = createMockRequestFactory<
            "/login",
            LoginResponseBody,
            Partial<{ id: string; password: string }>
        >();

        it("Gives a 500 if an error occurs during login", async () => {
            const error = new Error("Unexpected error");

            mockAuthService.login.mockRejectedValueOnce(error);

            const mockRequest = createMockRequest({
                body: { id: "C00000000", password: "password123" },
            });

            mockRequest.t.mockReturnValueOnce(error.message);

            await controller.login(mockRequest, mockResponse);

            expect(mockAuthService.login).toHaveBeenCalledWith(
                "C00000000",
                "password123",
            );

            expect(mockAuthService.createSession).not.toHaveBeenCalled();

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: error.message,
            });
        });
    });

    describe("logout", () => {
        it("Clears out session", () => {
            const mockRequest = createMockRequestFactory()();

            controller.logout(mockRequest, mockResponse);

            expect(mockAuthService.clearSession).toHaveBeenCalled();
        });
    });
});
