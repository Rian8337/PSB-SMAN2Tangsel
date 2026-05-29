import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";

/**
 * A flat row returned when fetching submission attachment paths for download.
 */
export interface SubmissionDownloadRow {
    readonly studentName: string;
    readonly studentIdentifier: string;
    readonly attachmentName: string;
    readonly attachmentPath: string;
}

/**
 * Defines operations for accessing assignment submission data in the database.
 */
export interface ISubmissionRepository {
    /**
     * Obtains all submissions for the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @returns An array of submission rows for all students who submitted.
     */
    getForAssignment(assignmentId: number): Promise<AssignmentSubmissionRow[]>;

    /**
     * Obtains the attachment paths for all submissions of the given assignment,
     * optionally filtered to a single student.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId An optional student ID to filter results to a single student.
     * @returns A flat array of rows, one per attachment file.
     */
    getForAssignmentWithAttachments(
        assignmentId: number,
        studentId?: number,
    ): Promise<SubmissionDownloadRow[]>;

    /**
     * Obtains the submission made by the given student for the given assignment, including
     * its attachments, or `null` if no submission exists.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     */
    getByStudent(
        assignmentId: number,
        studentId: number,
    ): Promise<SubjectAssignmentSubmission | null>;

    /**
     * Obtains the attachment IDs linked to the given submission.
     *
     * @param submissionId The unique identifier of the submission.
     * @returns An array of attachment IDs.
     */
    getAttachmentIds(submissionId: number): Promise<number[]>;

    /**
     * Creates a new submission for the given student and associates the provided attachments.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId The unique identifier of the student.
     * @param attachmentIds The IDs of the attachments to associate with the submission.
     * @returns The created submission.
     */
    add(
        assignmentId: number,
        studentId: number,
        attachmentIds: number[],
    ): Promise<SubjectAssignmentSubmission>;

    /**
     * Links additional attachments to an existing submission.
     *
     * @param submissionId The unique identifier of the submission.
     * @param attachmentIds The IDs of the new attachments to add.
     */
    addAttachments(submissionId: number, attachmentIds: number[]): Promise<void>;

    /**
     * Deletes the submission with the given ID.
     *
     * @param submissionId The unique identifier of the submission.
     */
    delete(submissionId: number): Promise<void>;
}
