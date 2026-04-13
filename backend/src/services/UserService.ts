import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { ITransactionManager, IUserRepository } from "@/repositories";
import { BadRequestError, NotFoundError } from "@/types";
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
        @inject(dependencyTokens.transactionManager)
        private readonly transactionManager: ITransactionManager,
        @inject(dependencyTokens.userRepository)
        private readonly userRepository: IUserRepository,
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
    ): Promise<void> {
        name = name.trim();
        identifier = identifier.trim();

        this.verifyName(name);

        if (password.trim().length === 0 || !passwordRegex.test(password)) {
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

    async update(userId: number, name: string, active: boolean): Promise<void> {
        name = name.trim();

        this.verifyName(name);

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        await this.userRepository.update(userId, name, active);
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
            !passwordRegex.test(newPassword)
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

    async delete(userId: number): Promise<void> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError("userService.userNotFound");
        }

        await this.transactionManager.execute(async (tx) => {
            // TODO: delete user's related data (e.g. assignment submissions) in a transaction when the corresponding repositories are implemented
            await this.userRepository.delete(user.id, tx);
        });

        // TODO: delete assignment submission files for students
    }

    private verifyName(name: string) {
        if (
            name.trim().length === 0 ||
            name.length > 100 ||
            !/^[a-zA-Z\s]+$/.test(name)
        ) {
            throw new BadRequestError("userService.invalidUsername");
        }
    }
}
