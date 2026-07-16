import {
    Class,
    DownloadTimeSeriesPoint,
    Subject,
    TopDownloadedAttachment,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * A visible assignment in scope for a teacher's submission analytics, along with the class-subject
 * context needed to classify and group submissions against it.
 */
export interface AnalyticsAssignmentRow {
    readonly assignmentId: number;
    readonly dueAt: Date | null;
    readonly classId: number;
    readonly classSubjectId: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly class: Pick<Class, "id" | "name">;
}

/**
 * A single student's membership in a class, for roster lookups.
 */
export interface ClassRosterRow {
    readonly classId: number;
    readonly studentId: number;
    readonly studentIdentifier: string;
    readonly studentName: string;
}

/**
 * The bare fact that a student submitted a given assignment at a given time.
 */
export interface SubmissionRecordRow {
    readonly assignmentId: number;
    readonly studentId: number;
    readonly submittedAt: Date;
}

/**
 * The raw data needed to compute submission analytics for a teacher — unclassified, since
 * classifying a submission's status (on-time/late/missing/pending) is a business rule, not a data
 * access concern, and belongs in the service layer.
 */
export interface SubmissionAnalyticsRawData {
    readonly assignments: AnalyticsAssignmentRow[];
    readonly roster: ClassRosterRow[];
    readonly submissions: SubmissionRecordRow[];
}

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
     * Returns the raw assignments/roster/submissions needed to compute submission analytics for a
     * teacher's visible assignments within the given session/semester. Does not classify or
     * aggregate — see {@link IAnalyticsService.getSubmissionAnalytics} for that.
     */
    getSubmissionAnalyticsRawData(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<SubmissionAnalyticsRawData>;
}
