import { AuthAPIClient } from "@/api";
import {
    FailedLoginResponse,
    SuccessfulLoginResponse,
    UserRole,
} from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("AuthAPIClient (unit)", () => {
    const client = new AuthAPIClient();

    const mockSuccessResponse: SuccessfulLoginResponse = {
        id: 1,
        name: "Admin",
        role: UserRole.administrator,
    };

    const mockFailedResponse: FailedLoginResponse = {
        error: "Unauthorized",
    };

    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("login", () => {
        it("should send a POST request with the correct JSON payload", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSuccessResponse),
            } as Response);

            const result = await client.login(
                "admin-user",
                "securePassword123",
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/auth/login");
            expect(options?.method).toBe("POST");

            expect(options?.headers).toEqual(
                expect.objectContaining({
                    "Content-Type": "application/json",
                }),
            );

            expect(options?.body).toBe(
                JSON.stringify({
                    id: "admin-user",
                    password: "securePassword123",
                }),
            );

            expect(options?.signal).toBe(controller.signal);
            expect(result).toEqual(mockSuccessResponse);
        });
    });

    describe("logout", () => {
        it("should send a POST request to the logout endpoint", async () => {
            const controller = new AbortController();

            await client.logout(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];

            expect((url as URL | string).toString()).toContain("/auth/logout");
            expect(options?.method).toBe("POST");
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("getMe", () => {
        it("should return the response object if the login is successful", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSuccessResponse),
            } as Response);

            const result = await client.getMe(controller.signal);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            expect((url as URL | string).toString()).toContain("/auth/me");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual(mockSuccessResponse);
        });

        it("should return null if the login response is not successful", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockFailedResponse),
            } as Response);

            const result = await client.getMe();

            expect(fetchSpy).toHaveBeenCalledOnce();
            expect(result).toBeNull();
        });
    });
});
