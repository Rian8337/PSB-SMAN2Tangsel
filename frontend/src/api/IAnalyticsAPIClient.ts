import {
    DownloadAnalytics,
    SubmissionAnalytics,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Provides operations for download analytics-related API calls.
 */
export interface IAnalyticsAPIClient {
    /**
     * Obtains the download-analytics payload (weekly time series + top-N ranking) for the currently
     * authenticated teacher's own materials/assignments within an academic session and semester.
     *
     * @param session The academic session to filter analytics by.
     * @param semester The semester to filter analytics by.
     * @param limit The maximum number of top downloaded attachments to return. Defaults to 5.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request.
     * @returns The download analytics payload.
     */
    getDownloadAnalytics(
        session: ValidSession,
        semester: ValidSemester,
        limit?: number,
        signal?: AbortSignal,
    ): Promise<DownloadAnalytics>;

    /**
     * Obtains the submission-analytics payload (status summary + "students needing attention"
     * ranking) for the currently authenticated teacher's own assignments within an academic session
     * and semester.
     *
     * @param session The academic session to filter analytics by.
     * @param semester The semester to filter analytics by.
     * @param limit The maximum number of concerning students to return. Defaults to 5.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request.
     * @returns The submission analytics payload.
     */
    getSubmissionAnalytics(
        session: ValidSession,
        semester: ValidSemester,
        limit?: number,
        signal?: AbortSignal,
    ): Promise<SubmissionAnalytics>;
}
