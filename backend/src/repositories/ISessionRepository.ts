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

    /**
     * Obtains a list of academic sessions and semesters for display in the UI.
     *
     * @param query The search query to filter academic sessions by session name.
     * @param limit The maximum number of academic sessions to return. Defaults to 5.
     * @param offset The number of academic sessions to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of academic sessions and semesters.
     */
    listSessions(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<AcademicSession[]>;
}
