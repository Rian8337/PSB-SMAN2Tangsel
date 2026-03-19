import { AcademicSession } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing academic session data in the database.
 */
export interface ISessionRepository {
    /**
     * Obtains the currently active semester.
     *
     * @returns The active academic session, or `null` if there is no active academic session.
     */
    getActive(): Promise<AcademicSession | null>;
}
