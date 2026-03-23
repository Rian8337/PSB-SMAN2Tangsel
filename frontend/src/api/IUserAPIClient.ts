import { UserListItem, UserRole } from "@psb/shared/types";

/**
 * Provides operations for user-related API calls.
 */
export interface IUserAPIClient {
    /**
     * Lists users for display in the UI.
     *
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(limit?: number, offset?: number): Promise<UserListItem[]>;

    /**
     * Registers a new user.
     *
     * @param name The name of the user.
     * @param password The password of the user.
     * @param role The role of the user.
     * @param identifier The unique identifier for the user.
     */
    createUser(
        name: string,
        password: string,
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
     * Updates the password of the currently authenticated user.
     *
     * @param currentPassword The current password of the user for verification.
     * @param newPassword The new password to be set for the user.
     */
    updatePassword(currentPassword: string, newPassword: string): Promise<void>;
}
