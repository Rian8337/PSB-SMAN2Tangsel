import {
    Class,
    UserListItem,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Defines operations for accessing and managing student enrollments in classes in the database.
 */
export interface IClassStudentRepository {
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
     * Obtains students that are not yet enrolled in any class in a specific academic session.
     *
     * @param session The academic session in the format "YYYY/YYYY" to obtain unenrolled students for.
     * @param semester The semester of the academic session (1 or 2) to obtain unenrolled students for.
     * @param query An optional search query to filter unenrolled students by name or identifier.
     * @param limit The maximum number of unenrolled students to return. Defaults to 5.
     * @param offset The number of unassigned students to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of students that are not yet assigned to any class in the specified academic session, optionally
     * filtered by the search query and paginated with limit and offset parameters.
     */
    getUnenrolledStudents(
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]>;

    /**
     * Checks if a student is already enrolled in any class for a specific session/semester.
     */
    findActiveEnrollment(
        studentId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<Class | null>;

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

    /**
     * Checks if the given student has any class enrollment record, past or present.
     * This is used to prevent deletion of students with existing enrollment history.
     *
     * @param studentId The unique identifier of the student.
     * @returns `true` if the student has any enrollment record, `false` otherwise.
     */
    hasEnrollments(studentId: number): Promise<boolean>;
}
