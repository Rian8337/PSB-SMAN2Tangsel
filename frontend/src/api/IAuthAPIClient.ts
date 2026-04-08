import { LoginResponseBody, SuccessfulLoginResponse } from "@psb/shared/types";

/**
 * Provides operations for authentication-related API calls.
 */
export interface IAuthAPIClient {
    /**
     * Logs in a user with the given ID and password.
     *
     * @param id The ID of the user to log in.
     * @param password The password of the user to log in.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the login request.
     * @returns The login response.
     */
    login(
        id: string,
        password: string,
        signal?: AbortSignal,
    ): Promise<LoginResponseBody>;

    /**
     * Logs out the currently authenticated user.
     *
     * @param signal An optional {@link AbortSignal} that can be used to cancel the logout request.
     * @returns A promise that resolves when the logout is successful, or rejects with an error if the logout fails.
     */
    logout(signal?: AbortSignal): Promise<void>;

    /**
     * Fetches the identity of the currently authenticated user.
     *
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to fetch the user's identity.
     * @returns A promise that resolves with the identity of the currently authenticated user, or `null` if the user is not authenticated.
     */
    getMe(signal?: AbortSignal): Promise<SuccessfulLoginResponse | null>;
}
