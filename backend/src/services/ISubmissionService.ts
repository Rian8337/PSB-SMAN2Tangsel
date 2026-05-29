import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";
import { TempFile } from "./IAttachmentService";

/**
 * Provides operations related to student submissions on an assignment.
 */
export interface ISubmissionService {
    /**
     * Obtains all student submissions for the given assignment, verifying that the teacher
     * is authorized to view them.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param teacherId The unique identifier of the requesting teacher.
     * @returns An array of submission rows for all students who submitted.
     */
    getSubmissions(
        assignmentId: number,
        teacherId: number,
    ): Promise<AssignmentSubmissionRow[]>;

    /**
     * Creates a ZIP archive of student submission attachments for the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param teacherId The unique identifier of the requesting teacher.
     * @param studentId An optional student ID to download only that student's submissions.
     * @returns A Buffer containing the ZIP archive.
     */
    downloadSubmissions(
        assignmentId: number,
        teacherId: number,
        studentId?: number,
    ): Promise<Buffer>;

    /**
     * Creates a new submission for the given student on the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @param files The files to attach to the submission.
     * @returns The created submission.
     * @throws {NotFoundError} If the assignment does not exist or is not visible to the student.
     * @throws {ConflictError} If the student already has a submission for this assignment.
     */
    addSubmission(
        assignmentId: number,
        studentId: number,
        files: TempFile[],
    ): Promise<SubjectAssignmentSubmission>;

    /**
     * Updates the submission of the given student on the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @param newFiles New files to attach to the submission.
     * @param renamedAttachments Existing attachments to rename.
     * @param deletedAttachmentIds IDs of existing attachments to delete.
     * @throws {NotFoundError} If the student has no submission for this assignment.
     */
    updateSubmission(
        assignmentId: number,
        studentId: number,
        newFiles: TempFile[],
        renamedAttachments: { id: number; newName: string }[],
        deletedAttachmentIds: number[],
    ): Promise<void>;

    /**
     * Removes the submission of the given student from the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @throws {NotFoundError} If the student has no submission for this assignment.
     */
    deleteSubmission(assignmentId: number, studentId: number): Promise<void>;
}
