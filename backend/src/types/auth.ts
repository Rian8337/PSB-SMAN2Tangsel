import { User, SessionData } from "@psb/shared/types";

/**
 * The result of a login operation.
 */
export interface LoginResult<
    TUser extends User = User,
    TSessionData extends SessionData = SessionData,
> {
    /**
     * The user from the login.
     */
    readonly user: TUser;

    /**
     * The session data that can be used to identify the user in subsequent requests.
     */
    readonly sessionData: TSessionData;
}
