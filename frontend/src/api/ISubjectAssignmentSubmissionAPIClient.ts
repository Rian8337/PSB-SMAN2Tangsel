import { AssignmentSubmissionRow } from "@psb/shared/types";

/**
 * Provides operations for subject assignment submission API calls.
 */
export interface ISubjectAssignmentSubmissionAPIClient {
    /**
     * Obtains all student submissions for the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns An array of submission rows for the given assignment.
     */
    getSubmissions(
        assignmentId: number,
        signal?: AbortSignal,
    ): Promise<AssignmentSubmissionRow[]>;

    /**
     * Downloads a ZIP archive of student submission attachments for the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param studentId An optional student ID to download only that student's submissions.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns An object containing the downloaded ZIP as a {@link Blob} and an optional filename.
     */
    downloadSubmissions(
        assignmentId: number,
        studentId?: number,
        signal?: AbortSignal,
    ): Promise<Readonly<{ blob: Blob; filename?: string }>>;
}
