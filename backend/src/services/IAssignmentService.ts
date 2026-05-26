import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";

/**
 * Provides operations related to assignment viewing.
 */
export interface IAssignmentService {
    /**
     * Obtains the assignment with the given ID for the given student.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @returns The assignment data for the given assignment and student.
     */
    getStudentAssignment(
        assignmentId: number,
        studentId: number,
    ): Promise<StudentSubjectAssignment>;

    /**
     * Obtains the assignment with the given ID for the given teacher.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param teacherId The unique identifier of the teacher.
     * @returns The assignment data for the given assignment and teacher.
     */
    getTeacherAssignment(
        assignmentId: number,
        teacherId: number,
    ): Promise<TeacherSubjectAssignment>;

    /**
     * Obtains the path and name of an assignment attachment for a student.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param attachmentId The unique identifier of the attachment.
     * @param studentId The unique identifier of the student.
     * @returns The path and name of the attachment for the given assignment, attachment ID, and
     * student.
     */
    getStudentAttachment(
        assignmentId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string }>;

    /**
     * Obtains the path and name of an assignment attachment for a teacher.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param attachmentId The unique identifier of the attachment.
     * @param teacherId The unique identifier of the teacher.
     * @returns The path and name of the attachment for the given assignment, attachment ID, and
     * teacher.
     */
    getTeacherAttachment(
        assignmentId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string }>;
}
