import { User, UserListItem } from "@psb/shared/types";

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

    /**
     * Fetches a list of users for display in the UI.
     *
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(limit?: number, offset?: number): Promise<UserListItem[]>;
}
