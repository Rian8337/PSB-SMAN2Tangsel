import { UserListItem } from "@psb/shared/types";

/**
 * A service that is responsible for handling operations related to student enrollments in classes.
 */
export interface IClassStudentService {
    /**
     * Obtains students currently enrolled in a class.
     *
     * @param classId The unique identifier of the class to obtain enrolled students for.
     * @param query An optional search query to filter enrolled students by name or identifier.
     * @param limit The maximum number of enrolled students to return. Defaults to 5.
     * @param offset The number of enrolled students to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of students currently enrolled in the specified class.
     */
    getEnrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]>;

    /**
     * Obtains students that are not yet enrolled to any class in a specific academic session.
     *
     * @param classId The unique identifier of the class to obtain unenrolled students for.
     * @param query An optional search query to filter unenrolled students by name or identifier.
     * @param limit The maximum number of unenrolled students to return. Defaults to 5.
     * @param offset The number of unassigned students to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of students that are not yet enrolled to any class in the specified academic session, optionally
     * filtered by the search query and paginated with limit and offset parameters.
     */
    getUnenrolledStudents(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]>;

    /**
     * Enrolls a student to a class.
     *
     * @param classId The unique identifier of the class to enroll the student to.
     * @param studentId The unique identifier of the student to enroll to the class.
     */
    enrollStudent(classId: number, studentId: number): Promise<void>;

    /**
     * Unenrolls a student from a class.
     *
     * @param classId The unique identifier of the class to unenroll the student from.
     * @param studentId The unique identifier of the student to unenroll from the class.
     */
    unenrollStudent(classId: number, studentId: number): Promise<void>;
}
