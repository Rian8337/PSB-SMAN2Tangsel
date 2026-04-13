import { UserListItem, UserRole } from "@psb/shared/types";

/**
 * Provides operations for user-related API calls.
 */
export interface IUserAPIClient {
    /**
     * Obtains detailed information about a specific user by their ID.
     *
     * @param id The ID of the user to retrieve.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to retrieve the user details.
     * @returns The user item containing detailed information about the user.
     */
    getUser(id: number, signal?: AbortSignal): Promise<UserListItem>;

    /**
     * Lists users for display in the UI.
     *
     * @param role An optional {@link UserRole} to filter the users by their role.
     * @param query The search query to filter users by name or identifier.
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to list users.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(
        role?: UserRole,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<UserListItem[]>;

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
     * Updates the details of an existing user.
     *
     * @param userId The ID of the user.
     * @param name The new name of the user.
     * @param active Whether the user is active.
     */
    updateUser(userId: number, name: string, active: boolean): Promise<void>;

    /**
     * Updates the password of the currently authenticated user.
     *
     * @param currentPassword The current password of the user for verification.
     * @param newPassword The new password to be set for the user.
     */
    updatePassword(currentPassword: string, newPassword: string): Promise<void>;

    /**
     * Deletes an existing user.
     *
     * @param userId The ID of the user to be deleted.
     */
    deleteUser(userId: number): Promise<void>;
}
