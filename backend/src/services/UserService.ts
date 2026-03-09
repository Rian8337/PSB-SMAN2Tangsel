import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IUserService } from "./IUserService";
import { inject } from "tsyringe";
import { IUserRepository } from "@/repositories";
import { User } from "@psb/shared/types";
import { NotFoundError } from "@/types";

/**
 * A service that is responsible for handling user-related operations.
 */
@Injectable(dependencyTokens.userService)
export class UserService implements IUserService {
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
}
