import { UserRole } from "@psb/shared/types";

/**
 * Data stored in the encrypted session cookie.
 */
export interface SessionData {
    /**
     * The ID of the authenticated user.
     */
    readonly userId: number;

    /**
     * The role of the authenticated user.
     */
    readonly role: UserRole;
}
