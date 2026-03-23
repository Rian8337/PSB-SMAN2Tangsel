import { AuthService } from "@/services";
import {
    AdministratorSessionData,
    EnvironmentVariableKey,
    LoginResult,
    StudentSessionData,
    UnauthorizedError,
} from "@/types";
import { Administrator, Student, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockAdministratorRepository,
    mockConfigService,
    mockStudentRepository,
    mockTeacherRepository,
} from "@test/mocks";
import { hashSync } from "bcrypt";

const createService = () =>
    new AuthService(
        mockConfigService,
        mockStudentRepository,
        mockTeacherRepository,
        mockAdministratorRepository,
    );

describe("AuthService (unit)", () => {
    describe("Initialization", () => {
        it("should throw if session encryption key is not 32 characters long", () => {
            vi.stubEnv(
                EnvironmentVariableKey.sessionEncryptionKey,
                "*".repeat(16),
            );

            expect(createService).toThrow();

            vi.unstubAllEnvs();
        });
    });

    describe("Operations", () => {
        const service = createService();
        let studentLoginData: LoginResult<Student, StudentSessionData>;

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 3, 20, 8));

            studentLoginData = {
                user: {
                    active: true,
                    id: 1,
                    name: "Test",
                    nisn: "0011223344",
                    password: hashSync("test", 10),
                    role: UserRole.student,
                    userId: 1,
                },
                sessionData: {
                    role: UserRole.student,
                    userId: 1,
                    nisn: "0011223344",
                },
            };

            mockStudentRepository.getLoginData.mockResolvedValue(
                studentLoginData,
            );
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        describe("Student login", () => {
            it("should throw if NISN is not found", async () => {
                mockStudentRepository.getLoginData.mockResolvedValue(null);

                await expect(
                    service.login(studentLoginData.user.nisn, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });
        });

        describe("Staff login", () => {
            let administratorLoginData: LoginResult<
                Administrator,
                AdministratorSessionData
            >;

            beforeEach(() => {
                administratorLoginData = {
                    user: {
                        active: true,
                        id: 1,
                        name: "Test",
                        password: hashSync("test", 10),
                        role: UserRole.administrator,
                        staffId: 1,
                        userId: 1,
                    },
                    sessionData: {
                        role: UserRole.administrator,
                        userId: 1,
                        staffId: 1,
                    },
                };

                mockAdministratorRepository.getLoginData.mockResolvedValue(
                    administratorLoginData,
                );
            });

            it("should throw if staff ID format is invalid", async () => {
                await expect(service.login("123a", "test")).rejects.toThrow(
                    new UnauthorizedError("auth.invalidStaffId"),
                );

                await expect(service.login("012", "test")).rejects.toThrow(
                    new UnauthorizedError("auth.invalidStaffId"),
                );
            });

            it("should throw if staff ID is not found", async () => {
                mockAdministratorRepository.getLoginData.mockResolvedValue(
                    null,
                );

                mockTeacherRepository.getLoginData.mockResolvedValue(null);

                await expect(service.login("1", "test")).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if administrator account is inactive", async () => {
                administratorLoginData.user.active = false;

                await expect(
                    service.login(
                        administratorLoginData.user.staffId.toString(),
                        "test",
                    ),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should login as teacher in case of staff ID collision", async () => {
                mockTeacherRepository.getLoginData.mockResolvedValue({
                    user: {
                        active: true,
                        id: 2,
                        name: "Test",
                        password: hashSync("test", 10),
                        role: UserRole.teacher,
                        staffId: 1,
                        userId: 2,
                    },
                    sessionData: {
                        role: UserRole.teacher,
                        userId: 2,
                        staffId: 1,
                    },
                });

                await service.login(
                    administratorLoginData.user.staffId.toString(),
                    "test",
                );

                expect(mockTeacherRepository.getLoginData).toHaveBeenCalled();

                expect(
                    mockAdministratorRepository.getLoginData,
                ).not.toHaveBeenCalled();
            });
        });

        describe("Validation", () => {
            it("should throw if user is inactive", async () => {
                studentLoginData.user.active = false;

                await expect(
                    service.login(studentLoginData.user.nisn, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if password is incorrect", async () => {
                await expect(
                    service.login(studentLoginData.user.nisn, "test2"),
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
                service.createSession(res, studentLoginData.sessionData);

                expect(res.cookie).toHaveBeenCalledWith(
                    "session",
                    expect.any(String),
                    expect.objectContaining({ maxAge: 2 * 60 * 60 * 1000 }),
                );
            });

            it("should clear session", () => {
                const res = createMockResponse();

                service.clearSession(res);

                expect(res.clearCookie).toHaveBeenCalled();
            });

            it("should verify valid session", () => {
                service.createSession(res, studentLoginData.sessionData);
                const token = res.cookie.mock.calls[0][1] as string;

                const req = createMockRequestFactory()({
                    signedCookies: { session: token },
                });

                service.verifySession()(req, res, next);

                expect(req.sessionData).toEqual(studentLoginData.sessionData);
                expect(next).toHaveBeenCalled();
            });

            it("should reject an expired session", () => {
                service.createSession(res, studentLoginData.sessionData);
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
                service.createSession(res, studentLoginData.sessionData);
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
