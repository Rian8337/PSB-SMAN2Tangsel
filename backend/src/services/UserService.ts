import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "./IUserService";
import { inject } from "tsyringe";
import { IUserRepository } from "@/repositories";
import { User, UserListItem, UserRole } from "@psb/shared/types";
import { BadRequestError, NotFoundError } from "@/types";
import { compare, hash } from "bcrypt";

/**
 * A service that is responsible for handling user-related operations.
 */
@Injectable(dependencyTokens.userService)
export class UserService implements IUserService {
    // Passwords must be at least 8 characters long with 1 capital letter, 1 lowercase letter, 1 number, and 1 symbol.
    private readonly passwordRegex =
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/;

    constructor(
        @inject(dependencyTokens.userRepository)
        private readonly userRepository: IUserRepository,
    ) {}

    async findById(id: number): Promise<User> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError("userRepository.userNotFound");
        }

        return user;
    }

    listUsers(limit?: number, offset?: number): Promise<UserListItem[]> {
        return this.userRepository.listUsers(limit, offset);
    }

    async create(
        name: string,
        password: string,
        role: UserRole,
        identifier: string,
    ): Promise<void> {
        name = name.trim();
        identifier = identifier.trim();

        if (
            name.length === 0 ||
            name.length > 100 ||
            !/^[a-zA-Z\s]+$/.test(name)
        ) {
            throw new BadRequestError("userService.invalidUsername");
        }

        if (
            password.trim().length === 0 ||
            !this.passwordRegex.test(password)
        ) {
            throw new BadRequestError("userService.invalidPassword");
        }

        if (identifier.length === 0) {
            throw new BadRequestError("userService.invalidIdentifier");
        }

        switch (role) {
            case UserRole.student:
                if (!/^\d{10}$/.test(identifier)) {
                    throw new BadRequestError("userService.invalidIdentifier");
                }
                break;

            case UserRole.teacher:
                if (!/^[1-9]\d*$/.test(identifier)) {
                    throw new BadRequestError("userService.invalidIdentifier");
                }
                break;

            default:
                throw new BadRequestError("userService.invalidRole");
        }

        return this.userRepository.create(
            name,
            await hash(password, 12),
            role,
            identifier,
        );
    }

    updateActiveState(userId: number, active: boolean): Promise<void> {
        return this.userRepository.updateActiveState(userId, active);
    }

    async updatePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        const passwordMatch = await compare(currentPassword, user.password);

        if (!passwordMatch) {
            throw new BadRequestError("userService.invalidPassword");
        }

        if (
            newPassword.trim().length === 0 ||
            !this.passwordRegex.test(newPassword)
        ) {
            throw new BadRequestError("userService.invalidPassword");
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
}
