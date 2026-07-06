import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    IClassStudentRepository,
    ISubmissionRepository,
    IUserRepository,
} from "@/repositories";
import { BadRequestError, ConflictError, NotFoundError } from "@/types";
import { User, UserListItem, UserRole } from "@psb/shared/types";
import { passwordRegex } from "@psb/shared/validator";
import { compare, hash } from "bcrypt";
import { inject } from "tsyringe";
import { IUserService } from "./IUserService";

/**
 * A service that is responsible for handling user-related operations.
 */
@Injectable(dependencyTokens.userService)
export class UserService implements IUserService {
    constructor(
        @inject(dependencyTokens.userRepository)
        private readonly userRepository: IUserRepository,
        @inject(dependencyTokens.submissionRepository)
        private readonly submissionRepository: ISubmissionRepository,
        @inject(dependencyTokens.classStudentRepository)
        private readonly classStudentRepository: IClassStudentRepository,
    ) {}

    async findById(id: number): Promise<User> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        return user;
    }

    listUsers(
        role?: UserRole,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]> {
        return this.userRepository.listUsers(role, query, limit, offset);
    }

    async create(
        name: string,
        password: string,
        role: UserRole,
        identifier: string,
    ) {
        name = name.trim();
        identifier = identifier.trim();

        this.verifyName(name);

        if (password.trim().length === 0 || !passwordRegex.test(password)) {
            throw new BadRequestError("user.invalidPassword");
        }

        if (identifier.length === 0) {
            throw new BadRequestError("user.invalidIdentifier");
        }

        switch (role) {
            case UserRole.Student:
                if (!/^\d{10}$/.test(identifier)) {
                    throw new BadRequestError("user.invalidIdentifier");
                }
                break;

            case UserRole.Teacher:
                if (!/^[1-9]\d*$/.test(identifier)) {
                    throw new BadRequestError("user.invalidIdentifier");
                }
                break;

            default:
                throw new BadRequestError("user.invalidRole");
        }

        return this.userRepository.create(
            name,
            await hash(password, 12),
            role,
            identifier,
        );
    }

    async update(
        userId: number,
        name: string,
        active: boolean,
        requesterId: number,
    ) {
        name = name.trim();

        this.verifyName(name);

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        if (user.role === UserRole.Administrator && user.active && !active) {
            await this.verifyAdministratorRemoval(userId);
        }

        if (userId === requesterId && !active) {
            throw new BadRequestError("userService.cannotModifySelf");
        }

        await this.userRepository.update(userId, name, active);
    }

    async updatePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        const passwordMatch = await compare(currentPassword, user.password);

        if (!passwordMatch) {
            throw new BadRequestError("user.invalidPassword");
        }

        if (
            newPassword.trim().length === 0 ||
            !passwordRegex.test(newPassword)
        ) {
            throw new BadRequestError("user.invalidPassword");
        }

        const samePassword = await compare(newPassword, user.password);

        if (samePassword) {
            throw new BadRequestError("userService.duplicatePassword");
        }

        await this.userRepository.updatePassword(
            userId,
            await hash(newPassword, 12),
        );
    }

    async delete(userId: number, requesterId: number) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        if (user.role === UserRole.Administrator && user.active) {
            await this.verifyAdministratorRemoval(userId);
        }

        if (userId === requesterId) {
            throw new BadRequestError("userService.cannotModifySelf");
        }

        if (user.role === UserRole.Student) {
            const [hasSubmissions, hasEnrollments] = await Promise.all([
                this.submissionRepository.hasSubmissions(userId),
                this.classStudentRepository.hasEnrollments(userId),
            ]);

            if (hasSubmissions || hasEnrollments) {
                throw new ConflictError("userService.userInUse");
            }
        }

        await this.userRepository.delete(user.id);
    }

    private async verifyAdministratorRemoval(userId: number) {
        const remainingActiveAdministrators =
            await this.userRepository.countActiveAdministrators(userId);

        if (remainingActiveAdministrators === 0) {
            throw new BadRequestError(
                "userService.cannotRemoveLastAdministrator",
            );
        }
    }

    private verifyName(name: string) {
        if (
            name.trim().length === 0 ||
            name.length > 100 ||
            !/^[a-zA-Z\s]+$/.test(name)
        ) {
            throw new BadRequestError("user.invalidName");
        }
    }
}
