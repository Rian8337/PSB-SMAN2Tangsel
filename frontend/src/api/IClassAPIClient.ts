import {
    Class,
    ScheduleDTO,
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
     * Obtains the weekly schedule of a class by the class's unique identifier.
     *
     * @param id The unique identifier of the class whose schedule to obtain.
     * @param signal Optional {@link AbortSignal} that can be used to cancel the request to obtain the class schedule.
     * @returns The weekly schedule of the class with the specified unique identifier.
     */
    getClassSchedule(id: number, signal?: AbortSignal): Promise<ScheduleDTO[]>;

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
}
