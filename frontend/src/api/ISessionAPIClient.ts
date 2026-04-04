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
     * Retrieves the details of a specific academic session and semester.
     *
     * @param session The session of the academic session to retrieve.
     * @param semester The semester of the academic session to retrieve.
     * @returns The details of the specified academic session and semester, or `null` if it does not exist.
     */
    getSession(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<AcademicSessionDTO | null>;

    /**
     * Creates a new academic session and semester with the specified details.
     *
     * @param session
     * @param semester
     * @param startTime
     * @param endTime
     * @param active
     */
    createSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: number,
        endTime: number,
        active: boolean,
    ): Promise<void>;

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
     * Updates the specified academic session and semester with new details.
     *
     * @param session The session of the academic session to update.
     * @param semester The semester of the academic session to update.
     * @param startTime The new start time of the academic session, represented as a Unix timestamp in milliseconds.
     * @param endTime The new end time of the academic session, represented as a Unix timestamp in milliseconds.
     * @param active The new active status of the academic session.
     */
    updateSession(
        session: ValidSession,
        semester: ValidSemester,
        startTime: number,
        endTime: number,
        active: boolean,
    ): Promise<void>;

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
