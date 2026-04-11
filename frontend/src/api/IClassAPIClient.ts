import {
    Class,
    ClassSubjectAssignment,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Options for listing classes.
 */
export interface ListClassOptions {
    /**
     * The academic session in the format "YYYY/YYYY" to filter classes by. If not provided, the current academic session will be used.
     */
    readonly session?: ValidSession;

    /**
     * The semester of the academic session (1 or 2) to filter classes by. If not provided, the current semester will be used.
     */
    readonly semester?: ValidSemester;

    /**
     * The search query to filter classes by name.
     */
    readonly query?: string;

    /**
     * The maximum number of classes to return. Defaults to 5.
     */
    readonly limit?: number;

    /**
     * The number of classes to skip before starting to collect the result set. Defaults to 0.
     */
    readonly offset?: number;

    /**
     * Optional {@link AbortSignal} that can be used to cancel the request to list classes.
     */
    readonly signal?: AbortSignal;
}

/**
 * Provides operations for class-related API calls.
 */
export interface IClassAPIClient {
    /**
     * Obtains a class by its unique identifier.
     *
     * @param id The unique identifier of the class to obtain.
     * @returns The class with the specified unique identifier.
     */
    getClass(id: number, signal?: AbortSignal): Promise<Class>;

    /**
     * Obtains a list of subjects assigned to a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     *
     * @param classId The unique identifier of the class to obtain assigned subjects for.
     * @param query An optional search query to filter the assigned subjects by code or name.
     * @param limit The maximum number of assigned subjects to return. Defaults to 5.
     * @param offset The number of assigned subjects to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to obtain assigned subjects.
     * @returns A list of subjects assigned to the specified class, optionally filtered by the search query and paginated with limit and offset parameters.
     */
    listAssignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<ClassSubjectAssignment[]>;

    /**
     * Obtains a list of classes in a specific academic session for display in the UI.
     *
     * @param options Options for listing classes, including the academic session, semester, search query, pagination limit, and pagination offset.
     * @returns A list of classes matching the criteria specified in the options.
     */
    listClasses(options?: ListClassOptions): Promise<Class[]>;

    /**
     * Creates a new class with the specified details.
     *
     * @param name The name of the class to create.
     * @param session The academic session in the format "YYYY/YYYY" that the class is in.
     * @param semester The semester of the academic session (1 or 2) that the class is in.
     */
    createClass(
        name: string,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void>;

    /**
     * Updates the details of an existing class with the specified identifier.
     *
     * @param id The unique identifier of the class to update.
     * @param name The new name of the class.
     */
    updateClass(id: number, name: string): Promise<void>;

    /**
     * Deletes the class with the specified identifier from the database. This operation is only possible if there are no students enrolled
     * in the class and the class is not assigned to any subjects.
     *
     * @param id The unique identifier of the class to delete.
     */
    deleteClass(id: number): Promise<void>;

    /**
     * Assigns a subject to a class. If the teacher ID is not provided, the subject will be assigned to the class without a teacher.
     *
     * @param classId The unique identifier of the class to assign the subject to.
     * @param subjectId The unique identifier of the subject to assign to the class.
     * @param teacherId The unique identifier of the teacher to assign to the class subject. If `null`, the subject will be
     * assigned to the class without a teacher.
     */
    assignSubject(
        classId: number,
        subjectId: number,
        teacherId: number | null,
    ): Promise<void>;

    /**
     * Updates the teacher assigned to a class subject. If the teacher ID is not provided, the subject will be unassigned from any teacher.
     *
     * @param assignmentId The unique identifier of the class subject assignment to update the assigned teacher for.
     * @param teacherId The unique identifier of the teacher to assign to the class subject. If `null`, the subject will be unassigned from any teacher.
     */
    updateAssignedSubject(
        assignmentId: number,
        teacherId: number | null,
    ): Promise<void>;

    /**
     * Removes a subject assignment from a class, effectively unassigning the subject from the class. This operation is only possible if there are no
     * assignments and materials associated with the class subject assignment.
     *
     * @param assignmentId The unique identifier of the class subject assignment to remove.
     */
    unassignSubject(assignmentId: number): Promise<void>;
}
