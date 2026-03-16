import { AuthService } from "@/services";
import {
    AdministratorSessionData,
    EnvironmentVariableKey,
    ForbiddenError,
    LoginResult,
    StudentSessionData,
    UnauthorizedError,
} from "@/types";
import { Administrator, Student, UserRole } from "@psb/shared/types";
import {
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
        let service: AuthService;
        let studentLoginData: LoginResult<Student, StudentSessionData>;

        beforeEach(() => {
            service = createService();

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

        describe("Student login", () => {
            it("should throw if NISN is not found", async () => {
                mockStudentRepository.getLoginData.mockResolvedValue(null);

                await expect(() =>
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

            it("should throw if staff ID is not found", async () => {
                mockAdministratorRepository.getLoginData.mockResolvedValue(
                    null,
                );

                mockTeacherRepository.getLoginData.mockResolvedValue(null);

                await expect(() => service.login("1", "test")).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if administrator account is inactive", async () => {
                administratorLoginData.user.active = false;

                await expect(() =>
                    service.login(
                        administratorLoginData.user.staffId.toString(),
                        "test",
                    ),
                ).rejects.toThrow(
                    new ForbiddenError("auth.inactiveAdminAccount"),
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

                await expect(() =>
                    service.login(studentLoginData.user.nisn, "test"),
                ).rejects.toThrow(
                    new ForbiddenError("auth.inactiveUserAccount"),
                );
            });

            it("should throw if password is incorrect", async () => {
                await expect(() =>
                    service.login(studentLoginData.user.nisn, "test2"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });
        });

        describe("Session clearance", () => {
            it("should clear session", () => {
                const res = createMockResponse();

                service.clearSession(res);

                expect(res.clearCookie).toHaveBeenCalled();
            });
        });
    });
});
