import {
    DownloadAnalytics,
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
}
