import { Subject } from "@psb/shared/types";

/**
 * A service that is responsible for handling subject-related operations.
 */
export interface ISubjectService {
    /**
     * Finds a subject by its ID.
     *
     * @param id The ID of the subject.
     * @returns The subject with the specified ID.
     */
    findById(id: number): Promise<Subject>;

    /**
     * Finds a subject by its code.
     *
     * @param code The code of the subject.
     * @returns The subject with the specified code.
     */
    findByCode(code: string): Promise<Subject>;

    /**
     * Fetches a list of subjects for display in the UI.
     *
     * @param query An optional search query to filter subjects by name or code.
     * @param limit The maximum number of subjects to return. Defaults to 5.
     * @param offset The number of subjects to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of subjects matching the search query.
     */
    listSubjects(
        query?: string,
        limit?: number,
        offset?: number,
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
     * Deletes the subject with the specified identifier from the database. A subject can only be deleted if there are no classes that are taking the subject.
     *
     * @param id The unique identifier of the subject to delete.
     */
    deleteSubject(id: number): Promise<void>;
}
