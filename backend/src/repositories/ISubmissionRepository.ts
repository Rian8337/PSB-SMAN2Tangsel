import { AssignmentSubmissionRow } from "@psb/shared/types";

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
}
