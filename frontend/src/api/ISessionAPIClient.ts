import {
    AcademicSessionDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Provides operations for academic session-related API calls.
 */
export interface ISessionAPIClient {
    /**
     * Obtains the currently active academic session and semester.
     *
     * @returns The currently active academic session and semester, or `null` if there is no active session and semester.
     */
    getActive(): Promise<AcademicSessionDTO | null>;

    /**
     * Lists academic sessions and semesters for display in the UI.
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
    ): Promise<AcademicSessionDTO[]>;

    /**
     * Deletes the specified academic session and semester.
     *
     * @param session The session of the academic session to delete.
     * @param semester The semester of the academic session to delete.
     */
    deleteSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void>;
}
