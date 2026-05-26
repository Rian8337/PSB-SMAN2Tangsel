import { StudentSubjectAssignment, TeacherSubjectAssignment } from "@psb/shared/types";

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
}
