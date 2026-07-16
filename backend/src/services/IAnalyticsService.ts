import {
    DownloadAnalytics,
    SubmissionAnalytics,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

export interface IAnalyticsService {
    /**
     * Returns the combined download-analytics payload (weekly time series + top-N ranking) for a
     * teacher's own materials/assignments within a session/semester.
     */
    getDownloadAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        topLimit: number,
    ): Promise<DownloadAnalytics>;

    /**
     * Returns the submission analytics payload (summary + concerning students) for a teacher's
     * visible assignments within a session/semester.
     */
    getSubmissionAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        concernLimit: number,
    ): Promise<SubmissionAnalytics>;
}
