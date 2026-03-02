import { User } from "@psb/shared/types";

/**
 * A service that is responsible for handling user-related operations.
 */
export interface IUserService {
    /**
     * Finds a user by their ID.
     *
     * @param id The ID of the user.
     * @returns The user with the specified ID.
     */
    findById(id: number): Promise<User>;
}
