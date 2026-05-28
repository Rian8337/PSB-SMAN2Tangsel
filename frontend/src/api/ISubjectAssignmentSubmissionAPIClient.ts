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
}
