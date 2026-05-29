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

    /**
     * Creates a new assignment and links it to the given attachments.
     *
     * @param classSubjectId The ID of the class subject the assignment belongs to.
     * @param title The title of the assignment.
     * @param description The optional description of the assignment.
     * @param dueAt The optional due date of the assignment.
     * @param visible Whether the assignment is visible to students.
     * @param attachmentIds The IDs of the attachments to link.
     * @returns The created assignment.
     */
    addAssignment(
        classSubjectId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<TeacherSubjectAssignment>;

    /**
     * Updates the title, description, due date, visibility, and attachment links for an assignment.
     *
     * @param assignmentId The ID of the assignment to update.
     * @param title The new title.
     * @param description The new description.
     * @param dueAt The new due date.
     * @param visible The new visibility.
     * @param attachmentIds The full list of attachment IDs after the update.
     */
    updateAssignment(
        assignmentId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<void>;

    /**
     * Deletes an assignment by ID.
     *
     * @param assignmentId The ID of the assignment to delete.
     */
    deleteAssignment(assignmentId: number): Promise<void>;

    /**
     * Returns the attachment IDs linked directly to an assignment (not submissions).
     *
     * @param assignmentId The ID of the assignment.
     * @returns An array of attachment IDs.
     */
    getAssignmentAttachmentIds(assignmentId: number): Promise<number[]>;

    /**
     * Returns the attachment IDs from all submissions for the given assignment.
     *
     * @param assignmentId The ID of the assignment.
     * @returns An array of attachment IDs from all submissions.
     */
    getSubmissionAttachmentIds(assignmentId: number): Promise<number[]>;
}
