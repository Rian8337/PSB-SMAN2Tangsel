import { UserListItem } from "@psb/shared/types";

/**
 * Provides operations for API calls related to student enrollment in classes.
 */
export interface IClassStudentAPIClient {
    /**
     * Obtains a list of students enrolled in a specific class.
     *
     * @param classId The unique identifier of the class to obtain enrolled students for.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to obtain enrolled students.
     * @returns A list of students enrolled in the specified class.
     */
    getEnrolledStudents(
        classId: number,
        signal?: AbortSignal,
    ): Promise<UserListItem[]>;

    /**
     * Obtains a list of students not enrolled in a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     *
     * @param classId The unique identifier of the class to obtain unenrolled students for.
     * @param query An optional search query to filter unenrolled students by name or username.
     * @param limit The maximum number of unenrolled students to return. Defaults to 5.
     * @param offset The number of unenrolled students to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to obtain unenrolled students.
     * @returns A list of students not enrolled in the specified class, optionally filtered by the search query and paginated with limit and offset parameters.
     */
    getUnenrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<UserListItem[]>;

    /**
     * Enrolls a student in a class.
     *
     * @param classId The unique identifier of the class to enroll the student in.
     * @param studentId The unique identifier of the student to enroll.
     */
    enrollStudent(classId: number, studentId: number): Promise<void>;

    /**
     * Unenrolls a student from a class.
     *
     * @param classId The unique identifier of the class to unenroll the student from.
     * @param studentId The unique identifier of the student to unenroll.
     */
    unenrollStudent(classId: number, studentId: number): Promise<void>;
}
