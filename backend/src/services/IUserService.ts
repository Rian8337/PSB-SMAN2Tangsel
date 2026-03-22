import { User, UserListItem } from "@psb/shared/types";

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

    /**
     * Fetches a list of users for display in the UI.
     *
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(limit?: number, offset?: number): Promise<UserListItem[]>;
}
