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
}
