import { UserRole } from "@psb/shared/types";

/**
 * Base type for all sessions.
 */
interface BaseSessionData<TRole extends UserRole> {
    /**
     * The user ID of the authenticated user.
     */
    readonly userId: number;

    /**
     * The identifier of the authenticated user.
     *
     * For students, this is the NISN. For teachers and administrators, this is the staff ID.
     */
    readonly identifier: string;

    /**
     * The role of the authenticated user.
     */
    readonly role: TRole;
}

/**
 * Session data for a student.
 */
export interface StudentSessionData extends BaseSessionData<UserRole.student> {
    /**
     * The ID of the class the student is enrolled to.
     */
    readonly classId?: number;
}

/**
 * Session data for a teacher.
 */
export type TeacherSessionData = BaseSessionData<UserRole.teacher>;

/**
 * Session data for an administrator.
 */
export type AdministratorSessionData = BaseSessionData<UserRole.administrator>;

/**
 * All session data.
 */
export type SessionData =
    | StudentSessionData
    | TeacherSessionData
    | AdministratorSessionData;

/**
 * Represents a session cookie's payload after decryption.
 */
export interface SessionCookie {
    /**
     * The actual session data.
     */
    readonly data: unknown;

    /**
     * The timestamp (in milliseconds since the Unix epoch) when the session expires.
     */
    readonly expiresAt: number;
}
