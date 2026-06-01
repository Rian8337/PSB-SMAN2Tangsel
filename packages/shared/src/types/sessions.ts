import { sessions } from "../database/schema";

/**
 * The academic session, which consists of an academic year and a semester.
 */
export type AcademicSession = typeof sessions.$inferSelect;

/**
 * Types related to academic sessions.
 */
export type ValidSession = `${number}/${number}`;

/**
 * Semesters that are valid.
 */
export type ValidSemester = 1 | 2;

/**
 * Academic session data transferred between frontend and backend.
 */
export interface AcademicSessionDTO {
    readonly session: ValidSession;
    readonly active: boolean;
    readonly semester: ValidSemester;
    readonly startTime: number;
    readonly endTime: number;
}

/**
 * A session/semester pair representing one of the sessions a user has data in.
 */
export type UserSessionDTO = Pick<AcademicSessionDTO, "session" | "semester">;
