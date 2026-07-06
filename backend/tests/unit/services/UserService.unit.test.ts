import { UserService } from "@/services";
import { BadRequestError, ConflictError, NotFoundError } from "@/types";
import { User, UserRole } from "@psb/shared/types";
import {
    mockClassStudentRepository,
    mockSubmissionRepository,
    mockUserRepository,
} from "@test/mocks";

const bcryptMock = vi.hoisted(() => ({
    hash: vi.fn(),
    compare: vi.fn(),
}));

vi.mock("bcrypt", () => bcryptMock);

describe("UserService (unit)", () => {
    const service = new UserService(
        mockUserRepository,
        mockSubmissionRepository,
        mockClassStudentRepository,
    );

    const mockUser: User = {
        id: 1,
        name: "John Doe",
        role: UserRole.Student,
        active: true,
        password: "idk",
        identifier: "1234567890",
    };

    describe("findById", () => {
        it("should return a user if found", async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);

            const result = await service.findById(mockUser.id);

            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                mockUser.id,
            );

            expect(result).toEqual(mockUser);
        });

        it("should throw if user is not found", async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(service.findById(999)).rejects.toThrow(
                new NotFoundError("userService.userNotFound"),
            );
        });
    });

    describe("listUsers", () => {
        it("should delegate to UserRepository.listUsers with correct parameters", async () => {
            mockUserRepository.listUsers.mockResolvedValue([]);

            await service.listUsers(undefined, "Test", 10, 20);

            expect(mockUserRepository.listUsers).toHaveBeenCalledWith(
                undefined,
                "Test",
                10,
                20,
            );
        });
    });

    describe("create", () => {
        const validPassword = "StrongPassword123!";

        it("should hash the password and create a new user", async () => {
            bcryptMock.hash.mockResolvedValue("hashedPassword");
            mockUserRepository.create.mockResolvedValue(undefined);

            await service.create(
                "John Doe",
                validPassword,
                UserRole.Student,
                "1234567890",
            );

            expect(bcryptMock.hash).toHaveBeenCalledWith(validPassword, 12);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                "John Doe",
                "hashedPassword",
                UserRole.Student,
                "1234567890",
            );
        });

        it("should trim inputs before validation and creation", async () => {
            bcryptMock.hash.mockResolvedValue("hashedPassword");

            await service.create(
                "   John Doe   ",
                validPassword,
                UserRole.Student,
                "  1234567890   ",
            );

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                "John Doe",
                "hashedPassword",
                UserRole.Student,
                "1234567890",
            );
        });

        it.each([
            // Empty username
            [""],
            // Too long
            ["A".repeat(101)],
            // Contains numbers
            ["John123"],
            // Contains symbols
            ["John_Doe"],
        ])("should throw for invalid username: %s", async (invalidUsername) => {
            await expect(
                service.create(
                    invalidUsername,
                    validPassword,
                    UserRole.Student,
                    "1234567890",
                ),
            ).rejects.toThrow(new BadRequestError("user.invalidName"));
        });

        it.each([
            // Empty password
            [""],
            // No capital letter, number, or symbol
            ["weakpassword"],
            // No symbol
            ["NoSymbol123"],
            // Too short
            ["N0Sym"],
        ])("should throw for invalid password: %s", async (invalidPassword) => {
            await expect(
                service.create(
                    "John Doe",
                    invalidPassword,
                    UserRole.Student,
                    "1234567890",
                ),
            ).rejects.toThrow(new BadRequestError("user.invalidPassword"));
        });

        it.each([
            // Too short
            ["12345"],
            // Too long
            ["12345678901"],
            // Letters included
            ["12345ABCDE"],
        ])(
            "should throw for invalid student identifier: %s",
            async (invalidIdentifier) => {
                await expect(
                    service.create(
                        "John Doe",
                        validPassword,
                        UserRole.Student,
                        invalidIdentifier,
                    ),
                ).rejects.toThrow(
                    new BadRequestError("user.invalidIdentifier"),
                );
            },
        );

        it.each([
            // Leading zero
            ["0123"],
            // Letters
            ["abc"],
            // Negative
            ["-100"],
        ])(
            "should throw for invalid teacher identifier: %s",
            async (invalidIdentifier) => {
                await expect(
                    service.create(
                        "John Doe",
                        validPassword,
                        UserRole.Teacher,
                        invalidIdentifier,
                    ),
                ).rejects.toThrow(
                    new BadRequestError("user.invalidIdentifier"),
                );
            },
        );

        it("should throw for unsupported roles", async () => {
            await expect(
                service.create(
                    "John Doe",
                    validPassword,
                    UserRole.Administrator,
                    "12345",
                ),
            ).rejects.toThrow(new BadRequestError("user.invalidRole"));
        });
    });

    describe("update", () => {
        const requesterId = 2;
        const identifier = mockUser.identifier;

        beforeEach(() => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRepository.findByIdentifier.mockResolvedValue(null);
        });

        it("should trim the name and identifier before validation and updating", async () => {
            mockUserRepository.update.mockResolvedValue(undefined);

            await service.update(
                1,
                "   John Doe   ",
                `  ${identifier}  `,
                true,
                requesterId,
            );

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                1,
                "John Doe",
                identifier,
                true,
            );
        });

        it.each([
            // Empty username
            [""],
            // Too long
            ["A".repeat(101)],
            // Contains numbers
            ["John123"],
            // Contains symbols
            ["John_Doe"],
        ])("should throw for invalid username: %s", async (invalidUsername) => {
            await expect(
                service.update(1, invalidUsername, identifier, true, requesterId),
            ).rejects.toThrow(new BadRequestError("user.invalidName"));
        });

        it("should throw if user is not found", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(null);

            await expect(
                service.update(999, "John Doe", identifier, true, requesterId),
            ).rejects.toThrow(new NotFoundError("userService.userNotFound"));
        });

        it.each([
            // Too short
            ["12345"],
            // Too long
            ["12345678901"],
            // Letters included
            ["12345ABCDE"],
        ])(
            "should throw for invalid student identifier: %s",
            async (invalidIdentifier) => {
                await expect(
                    service.update(
                        1,
                        "John Doe",
                        invalidIdentifier,
                        true,
                        requesterId,
                    ),
                ).rejects.toThrow(new BadRequestError("user.invalidIdentifier"));

                expect(mockUserRepository.update).not.toHaveBeenCalled();
            },
        );

        it.each([
            // Leading zero
            ["0123"],
            // Letters
            ["abc"],
            // Negative
            ["-100"],
        ])(
            "should throw for invalid teacher/administrator identifier: %s",
            async (invalidIdentifier) => {
                const teacherUser: User = {
                    ...mockUser,
                    role: UserRole.Teacher,
                };

                mockUserRepository.findById.mockResolvedValueOnce(teacherUser);

                await expect(
                    service.update(
                        1,
                        "John Doe",
                        invalidIdentifier,
                        true,
                        requesterId,
                    ),
                ).rejects.toThrow(new BadRequestError("user.invalidIdentifier"));

                expect(mockUserRepository.update).not.toHaveBeenCalled();
            },
        );

        it("should throw if the new identifier is already used by another user", async () => {
            const otherUser: User = {
                ...mockUser,
                id: 2,
                identifier: "9999999999",
            };

            mockUserRepository.findByIdentifier.mockResolvedValueOnce(
                otherUser,
            );

            await expect(
                service.update(
                    1,
                    "John Doe",
                    otherUser.identifier,
                    true,
                    requesterId,
                ),
            ).rejects.toThrow(
                new ConflictError("userService.duplicateIdentifier"),
            );

            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        it("should not check for duplicates if the identifier is unchanged", async () => {
            mockUserRepository.update.mockResolvedValue(undefined);

            await service.update(1, "John Doe", identifier, true, requesterId);

            expect(mockUserRepository.findByIdentifier).not.toHaveBeenCalled();
        });

        it("should throw if a user tries to deactivate their own account", async () => {
            await expect(
                service.update(1, "John Doe", identifier, false, 1),
            ).rejects.toThrow(
                new BadRequestError("userService.cannotModifySelf"),
            );

            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        it("should allow a user to rename or reactivate their own account", async () => {
            mockUserRepository.update.mockResolvedValue(undefined);

            await service.update(1, "John Doe", identifier, true, 1);

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                1,
                "John Doe",
                identifier,
                true,
            );
        });

        it("should throw when deactivating the last active administrator", async () => {
            const adminUser: User = {
                ...mockUser,
                role: UserRole.Administrator,
            };

            mockUserRepository.findById.mockResolvedValueOnce(adminUser);
            mockUserRepository.countActiveAdministrators.mockResolvedValueOnce(
                0,
            );

            await expect(
                service.update(1, "John Doe", identifier, false, requesterId),
            ).rejects.toThrow(
                new BadRequestError(
                    "userService.cannotRemoveLastAdministrator",
                ),
            );

            expect(
                mockUserRepository.countActiveAdministrators,
            ).toHaveBeenCalledWith(1);

            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });

        it("should allow deactivating an administrator if other active administrators remain", async () => {
            const adminUser: User = {
                ...mockUser,
                role: UserRole.Administrator,
            };

            mockUserRepository.findById.mockResolvedValueOnce(adminUser);
            mockUserRepository.countActiveAdministrators.mockResolvedValueOnce(
                1,
            );

            mockUserRepository.update.mockResolvedValue(undefined);

            await service.update(1, "John Doe", identifier, false, requesterId);

            expect(mockUserRepository.update).toHaveBeenCalledWith(
                1,
                "John Doe",
                identifier,
                false,
            );
        });
    });

    describe("updatePassword", () => {
        const mockUser: User = {
            id: 1,
            active: true,
            name: "John Doe",
            password: "oldHashedPassword",
            role: UserRole.Student,
            identifier: "1234567890",
        };

        const newPassword = "NewStrongPassword123!";

        beforeEach(() => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
        });

        it("should update password if all validations pass", async () => {
            // Old password matches
            bcryptMock.compare.mockResolvedValueOnce(true);
            // New password is not the same as old
            bcryptMock.compare.mockResolvedValueOnce(false);

            bcryptMock.hash.mockResolvedValue("newHashedPassword");
            mockUserRepository.updatePassword.mockResolvedValue(undefined);

            await service.updatePassword(1, "oldPassword", newPassword);

            expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
                1,
                "newHashedPassword",
            );
        });

        it("should throw if user is not found", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(null);

            await expect(
                service.updatePassword(999, "anyPassword", newPassword),
            ).rejects.toThrow(new NotFoundError("userService.userNotFound"));
        });

        it("should throw if current password is incorrect", async () => {
            bcryptMock.compare.mockResolvedValueOnce(false);

            await expect(
                service.updatePassword(1, "wrongPassword", newPassword),
            ).rejects.toThrow(new BadRequestError("user.invalidPassword"));
        });

        it("should throw if new password fails validation", async () => {
            bcryptMock.compare.mockResolvedValueOnce(true);

            await expect(
                service.updatePassword(1, "oldPassword", "weak"),
            ).rejects.toThrow(new BadRequestError("user.invalidPassword"));
        });

        it("should throw if new password is the same as current password", async () => {
            bcryptMock.compare.mockResolvedValueOnce(true);
            bcryptMock.compare.mockResolvedValueOnce(true);

            await expect(
                service.updatePassword(1, "oldP@ssword1", "oldP@ssword1"),
            ).rejects.toThrow(
                new BadRequestError("userService.duplicatePassword"),
            );
        });
    });

    describe("delete", () => {
        const mockUser: User = {
            id: 1,
            active: true,
            name: "John Doe",
            password: "hashedPassword",
            role: UserRole.Student,
            identifier: "1234567890",
        };

        const requesterId = 2;

        beforeEach(() => {
            mockSubmissionRepository.hasSubmissions.mockResolvedValue(false);
            mockClassStudentRepository.hasEnrollments.mockResolvedValue(false);
        });

        it("should delete the user", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(mockUser);
            mockUserRepository.delete.mockResolvedValueOnce(undefined);

            await service.delete(mockUser.id, requesterId);

            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                mockUser.id,
            );

            expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUser.id);
        });

        it("should throw if user is not found", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(null);

            await expect(service.delete(999, requesterId)).rejects.toThrow(
                new NotFoundError("userService.userNotFound"),
            );

            expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
            expect(mockUserRepository.delete).not.toHaveBeenCalled();
        });

        it("should throw if a user tries to delete their own account", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(mockUser);

            await expect(service.delete(1, 1)).rejects.toThrow(
                new BadRequestError("userService.cannotModifySelf"),
            );

            expect(mockUserRepository.delete).not.toHaveBeenCalled();
        });

        it("should throw when deleting the last active administrator", async () => {
            const adminUser: User = {
                ...mockUser,
                role: UserRole.Administrator,
            };

            mockUserRepository.findById.mockResolvedValueOnce(adminUser);
            mockUserRepository.countActiveAdministrators.mockResolvedValueOnce(
                0,
            );

            await expect(service.delete(1, requesterId)).rejects.toThrow(
                new BadRequestError(
                    "userService.cannotRemoveLastAdministrator",
                ),
            );

            expect(
                mockUserRepository.countActiveAdministrators,
            ).toHaveBeenCalledWith(1);

            expect(mockUserRepository.delete).not.toHaveBeenCalled();
        });

        it("should allow deleting an administrator if other active administrators remain", async () => {
            const adminUser: User = {
                ...mockUser,
                role: UserRole.Administrator,
            };

            mockUserRepository.findById.mockResolvedValueOnce(adminUser);
            mockUserRepository.countActiveAdministrators.mockResolvedValueOnce(
                1,
            );
            mockUserRepository.delete.mockResolvedValueOnce(undefined);

            await service.delete(1, requesterId);

            expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
        });

        it("should throw when deleting a student who has assignment submissions", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(mockUser);
            mockSubmissionRepository.hasSubmissions.mockResolvedValueOnce(true);

            await expect(
                service.delete(mockUser.id, requesterId),
            ).rejects.toThrow(new ConflictError("userService.userInUse"));

            expect(mockUserRepository.delete).not.toHaveBeenCalled();
        });

        it("should throw when deleting a student who has class enrollments", async () => {
            mockUserRepository.findById.mockResolvedValueOnce(mockUser);
            mockClassStudentRepository.hasEnrollments.mockResolvedValueOnce(
                true,
            );

            await expect(
                service.delete(mockUser.id, requesterId),
            ).rejects.toThrow(new ConflictError("userService.userInUse"));

            expect(mockUserRepository.delete).not.toHaveBeenCalled();
        });

        it("should not check for related data when deleting a non-student user", async () => {
            const teacherUser: User = { ...mockUser, role: UserRole.Teacher };

            mockUserRepository.findById.mockResolvedValueOnce(teacherUser);
            mockUserRepository.delete.mockResolvedValueOnce(undefined);

            await service.delete(teacherUser.id, requesterId);

            expect(
                mockSubmissionRepository.hasSubmissions,
            ).not.toHaveBeenCalled();

            expect(
                mockClassStudentRepository.hasEnrollments,
            ).not.toHaveBeenCalled();

            expect(mockUserRepository.delete).toHaveBeenCalledWith(
                teacherUser.id,
            );
        });
    });
});
