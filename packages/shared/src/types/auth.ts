import { UserRole } from "./users";

/**
 * Represents a successful login response.
 */
export interface SuccessfulLoginResponse {
    readonly id: number;
    readonly name: string;
    readonly role: UserRole;
}

/**
 * Represents a failed login response.
 */
export interface FailedLoginResponse {
    readonly error: string;
}

/**
 * The response that is given when a user logs in or checks for their identity.
 */
export type LoginResponseBody = SuccessfulLoginResponse | FailedLoginResponse;

/**
 * Determines whether a login response body represents a successful login.
 *
 * @param body The login response body to check.
 * @returns `true` if the body represents a successful login, `false` otherwise.
 */
export function isSuccessfulLogin(
    body: LoginResponseBody,
): body is SuccessfulLoginResponse {
    return (body as SuccessfulLoginResponse | undefined)?.id !== undefined;
}

/**
 * Determines whether a login response body represents a failed login.
 *
 * @param body The login response body to check.
 * @returns `true` if the body represents a failed login, `false` otherwise.
 */
export function isFailedLogin(
    body: LoginResponseBody,
): body is FailedLoginResponse {
    return (body as FailedLoginResponse | undefined)?.error !== undefined;
}
