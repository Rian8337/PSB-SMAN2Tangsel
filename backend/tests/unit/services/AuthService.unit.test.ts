import { AuthService } from "@/services";
import {
    EnvironmentVariableKey,
    ForbiddenError,
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
        let student: Student;

        beforeEach(() => {
            service = createService();

            student = {
                active: true,
                id: 1,
                name: "Test",
                nisn: "0011223344",
                password: hashSync("test", 10),
                role: UserRole.student,
                userId: 1,
            };

            mockStudentRepository.findByNISN.mockResolvedValue(student);
        });

        describe("Student login", () => {
            it("should throw if NISN is not found", async () => {
                mockStudentRepository.findByNISN.mockResolvedValue(null);

                await expect(() =>
                    service.login(student.nisn, "test"),
                ).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });
        });

        describe("Staff login", () => {
            let administrator: Administrator;

            beforeEach(() => {
                administrator = {
                    active: true,
                    id: 1,
                    name: "Test",
                    password: hashSync("test", 10),
                    role: UserRole.administrator,
                    staffId: 1,
                    userId: 1,
                };

                mockAdministratorRepository.findByStaffId.mockResolvedValue(
                    administrator,
                );
            });

            it("should throw if staff ID is not found", async () => {
                mockAdministratorRepository.findByStaffId.mockResolvedValue(
                    null,
                );

                mockTeacherRepository.findByStaffId.mockResolvedValue(null);

                await expect(() => service.login("1", "test")).rejects.toThrow(
                    new UnauthorizedError("auth.invalidCredentials"),
                );
            });

            it("should throw if administrator account is inactive", async () => {
                administrator.active = false;

                await expect(() =>
                    service.login(administrator.staffId.toString(), "test"),
                ).rejects.toThrow(
                    new ForbiddenError("auth.inactiveAdminAccount"),
                );
            });

            it("should login as teacher in case of staff ID collision", async () => {
                mockTeacherRepository.findByStaffId.mockResolvedValue({
                    active: true,
                    id: 2,
                    name: "Test",
                    password: hashSync("test", 10),
                    role: UserRole.teacher,
                    staffId: 1,
                    userId: 2,
                });

                await service.login(administrator.staffId.toString(), "test");

                expect(mockTeacherRepository.findByStaffId).toHaveBeenCalled();

                expect(
                    mockAdministratorRepository.findByStaffId,
                ).not.toHaveBeenCalled();
            });
        });

        describe("Validation", () => {
            it("should throw if user is inactive", async () => {
                student.active = false;

                await expect(() =>
                    service.login(student.nisn, "test"),
                ).rejects.toThrow(
                    new ForbiddenError("auth.inactiveUserAccount"),
                );
            });

            it("should throw if password is incorrect", async () => {
                await expect(() =>
                    service.login(student.nisn, "test2"),
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
