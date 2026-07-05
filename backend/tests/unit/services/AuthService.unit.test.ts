import { AuthService } from "@/services";
import {
    EnvironmentVariableKey,
    LoginResult,
    UnauthorizedError,
} from "@/types";
import { Student, StudentSessionData, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockConfigService,
    mockStudentRepository,
    mockUserRepository,
} from "@test/mocks";
import { hashSync } from "bcrypt";

const createService = () =>
    new AuthService(
        mockConfigService,
        mockUserRepository,
        mockStudentRepository,
    );

describe("AuthService (unit)", () => {
    describe("Initialization", () => {
        it("should throw if session encryption key is not 32 characters long", () => {
            vi.stubEnv(
                EnvironmentVariableKey.SessionEncryptionKey,
                "*".repeat(16),
            );

            expect(createService).toThrow();

            vi.unstubAllEnvs();
        });
    });

    describe("Operations", () => {
        const service = createService();
        let loginData: LoginResult<Student, StudentSessionData>;

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 3, 20, 8));

            loginData = {
                user: {
                    active: true,
                    id: 1,
                    name: "Test",
                    identifier: "0011223344",
                    password: hashSync("test", 10),
                    role: UserRole.Student,
                    userId: 1,
                },
                sessionData: {
                    role: UserRole.Student,
                    userId: 1,
                    identifier: "0011223344",
                },
            };

            mockUserRepository.findByIdentifier.mockResolvedValue(
                loginData.user,
            );
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe("Login", () => {
            it("should throw if identifier is not found", async () => {
                mockUserRepository.findByIdentifier.mockResolvedValue(null);

                await expect(
                    service.login(loginData.user.identifier, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if account is inactive", async () => {
                loginData.user.active = false;

                await expect(
                    service.login(loginData.user.identifier, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });
        });

        describe("Validation", () => {
            it("should throw if user is inactive", async () => {
                loginData.user.active = false;

                await expect(
                    service.login(loginData.user.identifier, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if password is incorrect", async () => {
                await expect(
                    service.login(loginData.user.identifier, "test2"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });
        });

        describe("Session lifecycle", () => {
            let res: ReturnType<typeof createMockResponse>;
            const next = vi.fn();

            beforeEach(() => {
                res = createMockResponse();
            });

            it("should create a session cookie with the correct maxAge", () => {
                service.createSession(res, loginData.sessionData);

                expect(res.cookie).toHaveBeenCalledWith(
                    "session",
                    expect.any(String),
                    expect.objectContaining({ maxAge: 2 * 60 * 60 * 1000 }),
                );
            });

            it("should clear session", () => {
                service.clearSession(res);

                expect(res.clearCookie).toHaveBeenCalled();
            });

            it("should verify valid session", () => {
                service.createSession(res, loginData.sessionData);
                const token = res.cookie.mock.calls[0][1] as string;

                const req = createMockRequestFactory()({
                    signedCookies: { session: token },
                });

                service.verifySession()(req, res, next);

                expect(req.sessionData).toEqual(loginData.sessionData);
                expect(next).toHaveBeenCalled();
            });

            it("should reject an expired session", () => {
                service.createSession(res, loginData.sessionData);
                const token = res.cookie.mock.calls[0][1] as string;

                // 2.1 hours later, so the session is expired.
                vi.advanceTimersByTime(2.1 * 60 * 60 * 1000);

                const req = createMockRequestFactory()({
                    signedCookies: { session: token },
                });

                service.verifySession()(req, res, next);

                expect(res.status).toHaveBeenCalledWith(401);
                expect(res.clearCookie).toHaveBeenCalled();
                expect(next).not.toHaveBeenCalled();
            });

            it("should renew the session if within the sliding window", () => {
                service.createSession(res, loginData.sessionData);
                const token = res.cookie.mock.calls[0][1] as string;

                res.cookie.mockClear();

                // 45 minutes, so there are 75 minutes left, which is within the sliding window (25% of 2 hours is 30 minutes).
                vi.advanceTimersByTime(45 * 60 * 1000);

                const req = createMockRequestFactory()({
                    signedCookies: { session: token },
                });

                service.verifySession()(req, res, next);

                expect(next).toHaveBeenCalled();
                expect(res.cookie).toHaveBeenCalled();
            });

            it("should reject an invalid session", () => {
                const badSession = {
                    data: { role: "student", userId: "nan" },
                    expiresAt: Date.now() + 100000,
                };

                const badToken = service.encryptSession(badSession);

                const req = createMockRequestFactory()({
                    signedCookies: { session: badToken },
                });

                service.verifySession()(req, res, next);

                expect(res.status).toHaveBeenCalledWith(401);
                expect(res.clearCookie).toHaveBeenCalled();
                expect(next).not.toHaveBeenCalled();
            });
        });
    });
});
