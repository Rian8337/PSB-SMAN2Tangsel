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
     * The role of the authenticated user.
     */
    readonly role: TRole;
}

/**
 * Session data for a student.
 */
export interface StudentSessionData extends BaseSessionData<UserRole.student> {
    /**
     * The NISN of the student.
     */
    readonly nisn: string;

    /**
     * The ID of the class the student is enrolled to.
     */
    readonly classId?: number;
}

/**
 * Session data for a teacher.
 */
export interface TeacherSessionData extends BaseSessionData<UserRole.teacher> {
    /**
     * The staff ID of the teacher.
     */
    readonly staffId: number;
}

/**
 * Session data for an administrator.
 */
export interface AdministratorSessionData extends BaseSessionData<UserRole.administrator> {
    /**
     * The staff ID of the administrator.
     */
    readonly staffId: number;
}

/**
 * All session data.
 */
export type SessionData =
    | StudentSessionData
    | TeacherSessionData
    | AdministratorSessionData;
