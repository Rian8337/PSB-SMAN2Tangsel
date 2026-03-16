import { SuccessfulLoginResponse } from "@psb/shared/types";

/**
 * Provides operations for authentication-related API calls.
 */
export interface IAuthAPIClient {
    /**
     * Logs in a user with the given ID and password.
     *
     * @param id The ID of the user to log in.
     * @param password The password of the user to log in.
     * @returns A promise that resolves when the login is successful, or rejects with an error if the login fails.
     */
    login(id: string, password: string): Promise<void>;

    /**
     * Logs out the currently authenticated user.
     *
     * @returns A promise that resolves when the logout is successful, or rejects with an error if the logout fails.
     */
    logout(): Promise<void>;

    /**
     * Fetches the identity of the currently authenticated user.
     *
     * @returns A promise that resolves with the identity of the currently authenticated user, or `null` if the user is not authenticated.
     */
    getMe(): Promise<SuccessfulLoginResponse | null>;
}
