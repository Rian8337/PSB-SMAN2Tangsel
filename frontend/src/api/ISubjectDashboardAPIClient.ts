import { SubjectDashboard } from "@psb/shared/types";

/**
 * Provides operations for subject dashboard API calls.
 */
export interface ISubjectDashboardAPIClient {
    /**
     * Obtains the subject dashboard for the currently authenticated user.
     *
     * @param classSubjectId The unique identifier of the class subject.
     * @param signal An optional {@link AbortSignal} to cancel the request.
     * @returns The subject dashboard for the given class subject.
     */
    getDashboard(
        classSubjectId: number,
        signal?: AbortSignal,
    ): Promise<SubjectDashboard>;
}
