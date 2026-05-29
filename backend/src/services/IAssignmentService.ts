import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import { TempFile } from "./IAttachmentService";

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

    /**
     * Creates a new assignment in the given class subject.
     *
     * @param classSubjectId The ID of the class subject.
     * @param teacherId The ID of the teacher creating the assignment.
     * @param title The title of the assignment.
     * @param description The optional description.
     * @param dueAt The optional due date.
     * @param visible Whether the assignment is visible to students.
     * @param files The uploaded files to attach.
     * @returns The created assignment.
     */
    addAssignment(
        classSubjectId: number,
        teacherId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        files: TempFile[],
    ): Promise<TeacherSubjectAssignment>;

    /**
     * Updates an existing assignment.
     *
     * @param assignmentId The ID of the assignment to update.
     * @param teacherId The ID of the teacher performing the update.
     * @param title The new title.
     * @param description The new description.
     * @param dueAt The new due date.
     * @param visible The new visibility.
     * @param newFiles New files to attach.
     * @param renamedAttachments Existing attachments to rename.
     * @param deletedAttachmentIds IDs of attachments to remove.
     */
    updateAssignment(
        assignmentId: number,
        teacherId: number,
        title: string,
        description: string | null,
        dueAt: Date | null,
        visible: boolean,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ): Promise<void>;

    /**
     * Deletes an assignment and all associated attachments and submissions.
     *
     * @param assignmentId The ID of the assignment to delete.
     * @param teacherId The ID of the teacher performing the deletion.
     */
    deleteAssignment(assignmentId: number, teacherId: number): Promise<void>;
}
