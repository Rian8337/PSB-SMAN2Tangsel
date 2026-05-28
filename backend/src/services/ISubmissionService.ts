import { AssignmentSubmissionRow } from "@psb/shared/types";

/**
 * Provides operations related to viewing student submissions on an assignment.
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
}
