import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
} from "@psb/shared/types";

/**
 * Provides operations for subject assignment API calls.
 */
export interface ISubjectAssignmentAPIClient {
    /**
     * Obtains the subject assignment for the currently authenticated user.
     *
     * @param assignmentId The unique identifier of the assignment.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns The subject assignment for the given assignment ID.
     */
    getAssignment(
        assignmentId: number,
        signal?: AbortSignal,
    ): Promise<StudentSubjectAssignment | TeacherSubjectAssignment>;

    /**
     * Creates a new assignment in a class subject.
     *
     * @param data The form data containing the assignment fields and optional files.
     * @returns The created assignment.
     */
    createAssignment(data: FormData): Promise<TeacherSubjectAssignment>;

    /**
     * Updates an existing assignment.
     *
     * @param assignmentId The unique identifier of the assignment to update.
     * @param data The form data containing updated fields and optional files.
     */
    updateAssignment(assignmentId: number, data: FormData): Promise<void>;

    /**
     * Deletes an assignment and all its attachments and submissions.
     *
     * @param assignmentId The unique identifier of the assignment to delete.
     */
    deleteAssignment(assignmentId: number): Promise<void>;
}
