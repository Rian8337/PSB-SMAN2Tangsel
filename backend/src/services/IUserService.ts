import { User, UserListItem, UserRole } from "@psb/shared/types";

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
     * @param role An optional {@link UserRole} to filter the users by their role.
     * @param query An optional search query to filter users by name or identifier.
     * @param limit The maximum number of users to return. Defaults to 5.
     * @param offset The number of users to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of user items containing basic information about each user.
     */
    listUsers(
        role?: UserRole,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]>;

    /**
     * Registers a new user.
     *
     * @param name The name of the user.
     * @param password The password of the user.
     * @param role The role of the user.
     * @param identifier The unique identifier for the user.
     */
    create(
        name: string,
        password: string,
        role: UserRole,
        identifier: string,
    ): Promise<void>;

    /**
     * Updates the name, identifier, and active state of an existing user.
     *
     * @param userId The ID of the user to update.
     * @param name The updated name.
     * @param identifier The updated identifier.
     * @param active The updated active state.
     * @param requesterId The ID of the user making the request.
     */
    update(
        userId: number,
        name: string,
        identifier: string,
        active: boolean,
        requesterId: number,
    ): Promise<void>;

    /**
     * Updates the password of an existing user.
     *
     * @param userId The ID of the user whose password is to be updated.
     * @param currentPassword The current password of the user for verification.
     * @param newPassword The new password to be set for the user.
     */
    updatePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void>;

    /**
     * Deletes an existing user.
     *
     * @param userId The ID of the user to be deleted.
     * @param requesterId The ID of the user making the request.
     */
    delete(userId: number, requesterId: number): Promise<void>;
}
