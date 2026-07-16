import {
    DownloadTimeSeriesPoint,
    SubmissionAnalytics,
    TopDownloadedAttachment,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Defines operations for aggregating download analytics data for a teacher.
 */
export interface IAnalyticsRepository {
    /**
     * Returns weekly download totals (across all of the teacher's material and assignment
     * attachments within the given session/semester), ordered by week ascending. Weeks with zero
     * downloads are omitted — callers that need a continuous series should fill gaps themselves.
     */
    getDownloadTimeSeries(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<DownloadTimeSeriesPoint[]>;

    /**
     * Returns the teacher's most-downloaded material and assignment attachments within the given
     * session/semester, ordered by download count descending.
     */
    getTopDownloadedAttachments(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
    ): Promise<TopDownloadedAttachment[]>;

    /**
     * Returns aggregate submission-status counts and a ranked list of students with late/missing
     * submissions, across all of the teacher's visible assignments within the given session/semester.
     */
    getSubmissionAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        concernLimit: number,
    ): Promise<SubmissionAnalytics>;
}
