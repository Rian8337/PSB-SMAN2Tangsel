import { User, UserListItem, UserRole } from "@psb/shared/types";

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

    /**
     * Registers a new user in the database.
     *
     * @param name The name of the user.
     * @param passwordHash The hashed password of the user.
     * @param role The role of the user.
     * @param identifier The unique identifier for the user.
     */
    create(
        name: string,
        passwordHash: string,
        role: UserRole,
        identifier: string,
    ): Promise<void>;

    /**
     * Updates the password hash of an existing user.
     *
     * @param userId The ID of the user whose password is to be updated.
     * @param newPasswordHash The new hashed password to be set for the user.
     */
    updatePassword(userId: number, newPasswordHash: string): Promise<void>;
}
