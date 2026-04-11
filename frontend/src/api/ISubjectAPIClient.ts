import { Subject } from "@psb/shared/types";

/**
 * Provides operations for subject-related API calls.
 */
export interface ISubjectAPIClient {
    /**
     * Retrieves the details of a specific subject by its ID.
     *
     * @param id The unique identifier of the subject to retrieve.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to retrieve the subject details.
     * @returns The details of the subject with the specified ID.
     */
    getSubject(id: number, signal?: AbortSignal): Promise<Subject>;

    /**
     * Lists subjects for display in the UI.
     *
     * @param query The search query to filter subjects by name or code.
     * @param limit The maximum number of subjects to return. Defaults to 5.
     * @param offset The number of subjects to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to list subjects.
     * @returns A list of subjects matching the search query.
     */
    listSubjects(
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<Subject[]>;

    /**
     * Lists subjects that are not yet assigned to a specific class for display in the subject selection dropdown when assigning subjects to a class.
     *
     * @param classId The unique identifier of the class to list unassigned subjects for.
     * @param query The search query to filter unassigned subjects by name or code.
     * @param limit The maximum number of unassigned subjects to return. Defaults to 5.
     * @param offset The number of unassigned subjects to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to list unassigned subjects.
     * @returns A list of subjects that are not yet assigned to the specified class, matching the search query.
     */
    listUnassignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<Subject[]>;

    /**
     * Creates a new subject with the specified details.
     *
     * @param code The unique code of the subject to create.
     * @param name The name of the subject to create.
     */
    createSubject(code: string, name: string): Promise<void>;

    /**
     * Updates the details of an existing subject with the specified identifier.
     *
     * @param id The unique identifier of the subject to update.
     * @param code The unique code of the subject to update.
     * @param name The name of the subject to update.
     * @param active The active status of the subject to update. If `true`, the subject will be visible in the subject selection dropdown when assigning subjects
     * to a class. Otherwise, the subject will not be visible in the subject selection dropdown, but will still be visible in the subject management page.
     */
    updateSubject(
        id: number,
        code: string,
        name: string,
        active: boolean,
    ): Promise<void>;

    /**
     * Deletes the subject with the specified identifier.
     *
     * @param id The unique identifier of the subject to delete.
     */
    deleteSubject(id: number): Promise<void>;
}
