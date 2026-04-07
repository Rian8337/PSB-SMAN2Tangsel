import { Subject } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing subject data in the database.
 */
export interface ISubjectRepository {
    /**
     * Retrieves the details of a subject by its unique identifier.
     *
     * @param id The unique identifier of the subject to retrieve.
     * @returns The details of the subject with the specified identifier, or `null` if it does not exist.
     */
    getById(id: number): Promise<Subject | null>;

    /**
     * Retrieves the details of a subject by its unique code.
     *
     * @param code The unique code of the subject to retrieve.
     * @returns The details of the subject with the specified code, or `null` if it does not exist.
     */
    getByCode(code: string): Promise<Subject | null>;

    /**
     * Obtains a list of subjects for display in the UI.
     *
     * @param query The search query to filter subjects by name or code.
     * @param limit The maximum number of subjects to return. Defaults to 5.
     * @param offset The number of subjects to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of subjects matching the search query.
     */
    list(query?: string, limit?: number, offset?: number): Promise<Subject[]>;

    /**
     * Creates a new subject with the specified details.
     *
     * @param code The unique code of the subject to create.
     * @param name The name of the subject to create.
     */
    create(code: string, name: string): Promise<void>;

    /**
     * Updates the details of an existing subject with the specified identifier.
     *
     * @param id The unique identifier of the subject to update.
     * @param code The unique code of the subject to update.
     * @param name The name of the subject to update.
     * @param active The active status of the subject to update. If `true`, the subject will be visible in the subject selection dropdown when assigning subjects
     * to a class. Otherwise, the subject will not be visible in the subject selection dropdown, but will still be visible in the subject management page.
     */
    update(
        id: number,
        code: string,
        name: string,
        active: boolean,
    ): Promise<void>;

    /**
     * Checks if there are any classes that are taking the subject with the specified identifier. This is used to determine if a subject can be safely
     * deleted from the database.
     *
     * @param id The unique identifier of the subject to check.
     * @returns `true` if the subject has associated classes, `false` otherwise.
     */
    hasClasses(id: number): Promise<boolean>;

    /**
     * Deletes the subject with the specified identifier from the database. This operation only works if there are no classes that are taking this subject.
     *
     * @param id The unique identifier of the subject to delete.
     */
    delete(id: number): Promise<void>;
}
