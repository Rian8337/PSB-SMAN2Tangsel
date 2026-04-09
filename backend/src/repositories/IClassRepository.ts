import { Class, ValidSemester, ValidSession } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing class data in the database.
 */
export interface IClassRepository {
    /**
     * Retrieves a class by its unique identifier.
     *
     * @param id The unique identifier of the class to retrieve.
     * @returns The class with the specified unique identifier, or `null` if no such class exists.
     */
    getById(id: number): Promise<Class | null>;

    /**
     * Obtains the user IDs of students enrolled in a class.
     *
     * @param classId The unique identifier of the class.
     * @returns The user IDs of students enrolled in the class.
     */
    getEnrolledStudentIds(classId: number): Promise<number[]>;

    /**
     * Obtains a list of classes in a specific academic session for display in the UI.
     *
     * @param session The academic session in the format "YYYY/YYYY" to filter classes by.
     * @param semester The semester of the academic session (1 or 2) to filter classes by.
     * @param query The search query to filter classes by name.
     * @param limit The maximum number of classes to return. Defaults to 5.
     * @param offset The number of classes to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of classes matching the criteria.
     */
    list(
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<Class[]>;

    /**
     * Creates a new class with the specified details.
     *
     * @param name The name of the class to create.
     * @param session The academic session in the format "YYYY/YYYY" that the class is in.
     * @param semester The semester of the academic session (1 or 2) that the class is in.
     */
    create(
        name: string,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void>;

    /**
     * Updates the details of an existing class with the specified identifier.
     *
     * @param id The unique identifier of the class to update.
     * @param name The name of the class to update.
     */
    update(id: number, name: string): Promise<void>;

    /**
     * Checks if any subjects are assigned to the class with the specified identifier. This is used to determine if a class can be safely deleted from the database.
     *
     * @param id The unique identifier of the class to check.
     * @returns `true` if the class has associated subjects, `false` otherwise.
     */
    hasSubjects(id: number): Promise<boolean>;

    /**
     * Checks if any students are enrolled in the class with the specified identifier. This is used to determine if a class can be safely deleted from the database.
     *
     * @param id The unique identifier of the class to check.
     * @returns `true` if the class has enrolled students, `false` otherwise.
     */
    hasStudents(id: number): Promise<boolean>;

    /**
     * Deletes the class with the specified identifier from the database.
     *
     * @param id The unique identifier of the class to delete.
     */
    delete(id: number): Promise<void>;
}
