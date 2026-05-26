import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";

/**
 * Defines operations for accessing assignment data in the database.
 */
export interface IAssignmentRepository {
    /**
     * Obtains the assignment with the given ID for the given student, or `null` if no such
     * assignment exists or the student is not enrolled in the class.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @returns The assignment data for the given assignment and student, or `null` if not found or
     * the student is not enrolled in the class.
     */
    getStudentAssignment(
        assignmentId: number,
        studentId: number,
    ): Promise<StudentSubjectAssignment | null>;

    /**
     * Obtains the assignment with the given ID for the given teacher, or `null` if no such
     * assignment exists or the teacher does not teach the class.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param teacherId The unique identifier of the teacher.
     * @returns The assignment data for the given assignment and teacher, or `null` if not found or
     * the teacher does not teach the class.
     */
    getTeacherAssignment(
        assignmentId: number,
        teacherId: number,
    ): Promise<TeacherSubjectAssignment | null>;

    /**
     * Obtains the path and name of an assignment attachment for a student, or `null` if not found
     * or the student is not enrolled in the class.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param attachmentId The unique identifier of the attachment.
     * @param studentId The unique identifier of the student.
     * @returns The path and name of the attachment for the given assignment, attachment ID, and
     * student, or `null` if not found or the student is not enrolled in the class.
     */
    getStudentAttachment(
        assignmentId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string } | null>;

    /**
     * Obtains the path and name of an assignment attachment for a teacher, or `null` if not found
     * or the teacher does not teach the class.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param attachmentId The unique identifier of the attachment.
     * @param teacherId The unique identifier of the teacher.
     * @returns The path and name of the attachment for the given assignment, attachment ID, and
     * teacher, or `null` if not found or the teacher does not teach the class.
     */
    getTeacherAttachment(
        assignmentId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string } | null>;
}
