import { UserRole } from "@psb/shared/types";

/**
 * The response that is given when a user logs in or checks for their identity.
 */
export type LoginResponseBody =
    | { id: number; name: string; role: UserRole }
    | { error: string };
