import { User } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing user data in the database.
 */
export interface IUserRepository {
    /**
     * Finds a user by their ID.
     *
     * @param id The ID of the user.
     * @return The user with the specified ID, or `null` if no such user exists.
     */
    findById(id: number): Promise<User | null>;
}
