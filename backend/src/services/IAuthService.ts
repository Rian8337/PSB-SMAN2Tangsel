import { LoginResult, SessionData } from "@/types";
import { UserRole } from "@psb/shared/types";
import { RequestHandler, Response } from "express";

/**
 * A service that is responsible for handling authentication-related operations.
 */
export interface IAuthService {
    /**
     * Logs in a user with the given ID and password.
     *
     * @param id The ID of the user to log in.
     * @param password The password of the user to log in.
     * @returns The result of the login operation.
     */
    login(id: string, password: string): Promise<LoginResult>;

    /**
     * Creates a session for a user.
     *
     * The session is signed and encrypted using the secret key.
     *
     * @param res The response object.
     * @param data The data to be stored in the session.
     * @throws {Error} If the session cannot be created.
     */
    createSession(res: Response, data: unknown): void;

    /**
     * Destroys the session of a user.
     *
     * @param res The response object.
     */
    clearSession(res: Response): void;

    /**
     * Creates a middleware that verifies the session of a user.
     *
     * @param allowedRoles The roles that are allowed to access the route. If empty, any authenticated role is allowed.
     * @returns A middleware function that verifies the session of a user.
     */
    verifySession(
        ...allowedRoles: UserRole[]
    ): RequestHandler<unknown, { error: string }>;

    /**
     * Encrypts a session using AES-256-GCM encryption.
     *
     * @param data The session data.
     * @returns The session token.
     */
    encryptSession(data: unknown): string;

    /**
     * Decrypts an AES-256-GCM encrypted session token.
     *
     * @param token The session token.
     * @returns The session data.
     */
    decryptSession(token: string): {
        readonly data: SessionData;
        readonly expiresAt: number;
    };
}
