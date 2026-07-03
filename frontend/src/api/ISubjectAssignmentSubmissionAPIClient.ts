import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";

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

    /**
     * Creates a new submission for the authenticated student on the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param data The multipart form data containing the files to upload.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns The created submission.
     */
    createSubmission(
        assignmentId: number,
        data: FormData,
        signal?: AbortSignal,
    ): Promise<SubjectAssignmentSubmission>;

    /**
     * Updates the submission of the authenticated student on the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param data The multipart form data with attachment changes and any new files.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     */
    updateSubmission(
        assignmentId: number,
        data: FormData,
        signal?: AbortSignal,
    ): Promise<void>;

    /**
     * Deletes the submission of the authenticated student on the given assignment.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     */
    deleteSubmission(assignmentId: number, signal?: AbortSignal): Promise<void>;
}
