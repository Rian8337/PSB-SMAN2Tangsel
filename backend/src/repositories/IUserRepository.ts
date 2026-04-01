import { Transaction, User, UserListItem, UserRole } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing user data in the database.
 */
export interface IUserRepository {
    /**
     * Finds a user by their ID.
     *
     * @param id The ID of the user.
     * @returns The user with the specified ID, or `null` if no such user exists.
     */
    findById(id: number): Promise<User | null>;

    /**
     * Finds a user by their unique identifier (NISN for students, staff ID for teachers and administrators).
     *
     * @param identifier The unique identifier of the user.
     * @returns The user with the specified identifier, or `null` if no such user exists.
     */
    findByIdentifier(identifier: string): Promise<User | null>;

    /**
     * Fetches a list of users for display in the UI.
     *
     * @param query An optional search query to filter users by name or identifier.
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]>;

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
     * Updates the active state of an existing user.
     *
     * @param userId The ID of the user whose active state is to be updated.
     * @param active The new active state to be set for the user.
     */
    updateActiveState(userId: number, active: boolean): Promise<void>;

    /**
     * Updates the password hash of an existing user.
     *
     * @param userId The ID of the user whose password is to be updated.
     * @param newPasswordHash The new hashed password to be set for the user.
     */
    updatePassword(userId: number, newPasswordHash: string): Promise<void>;

    /**
     * Deletes an existing user from the database.
     *
     * @param userId The ID of the user to be deleted.
     * @param tx An optional transaction object to execute the delete operation within a transaction. If not provided, the delete operation will be executed without a transaction.
     */
    delete(userId: number, tx?: Transaction): Promise<void>;
}
