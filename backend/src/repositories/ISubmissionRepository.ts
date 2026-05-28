import { AssignmentSubmissionRow } from "@psb/shared/types";

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
}
