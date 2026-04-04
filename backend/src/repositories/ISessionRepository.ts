import {
    AcademicSession,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

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
     * Retrieves the details of a specific academic session and semester.
     *
     * @param session The session of the academic session to retrieve.
     * @param semester The semester of the academic session to retrieve.
     * @returns The details of the specified academic session and semester, or `null` if it does not exist.
     */
    get(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<AcademicSession | null>;

    /**
     * Obtains a list of academic sessions and semesters for display in the UI.
     *
     * @param query The search query to filter academic sessions by session name.
     * @param limit The maximum number of academic sessions to return. Defaults to 5.
     * @param offset The number of academic sessions to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of academic sessions and semesters.
     */
    list(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<AcademicSession[]>;

    /**
     * Creates a new academic session and semester with the specified details.
     *
     * @param session The session of the academic session to create.
     * @param semester The semester of the academic session to create.
     * @param startTime The start time of the academic session.
     * @param endTime The end time of the academic session.
     * @param active The active status of the academic session. If `true`, this academic session will be set as the
     * active session, and any previously active session will be deactivated.
     */
    create(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ): Promise<void>;

    /**
     * Updates the specified academic session and semester with new details.
     *
     * @param session The session of the academic session to update.
     * @param semester The semester of the academic session to update.
     * @param startTime The new start time of the academic session.
     * @param endTime The new end time of the academic session.
     * @param active The new active status of the academic session. If `true`, this academic session will be set as the active session, and any previously active session will be deactivated.
     */
    update(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ): Promise<void>;

    /**
     * Deletes the specified academic session and semester. They must not be active.
     *
     * @param session The session of the academic session to delete.
     * @param semester The semester of the academic session to delete.
     */
    delete(session: ValidSession, semester: ValidSemester): Promise<void>;
}
