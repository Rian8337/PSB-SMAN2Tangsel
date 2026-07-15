import { Class } from "./classes";
import { Subject } from "./subjects";

/**
 * A single point in a weekly download time series.
 */
export interface DownloadTimeSeriesPoint {
    /**
     * The Monday date (ISO, `YYYY-MM-DD`) that starts this week's bucket.
     */
    readonly weekStart: string;

    /**
     * The total number of downloads recorded across the teacher's material and assignment
     * attachments during this week.
     */
    readonly count: number;
}

/**
 * A single entry in the "Top downloaded attachments" ranking, displayed to a teacher.
 */
export interface TopDownloadedAttachment {
    readonly attachmentId: number;
    readonly name: string;
    readonly downloadCount: number;

    /**
     * Whether this attachment belongs to a material or an assignment — determines which detail
     * page it should link to.
     */
    readonly type: "material" | "assignment";

    /**
     * The ID of the owning material or assignment (per {@link type}).
     */
    readonly contentId: number;

    /**
     * The title of the owning material or assignment.
     */
    readonly contentTitle: string;

    readonly classSubjectId: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly class: Pick<Class, "id" | "name">;
}

/**
 * The full download analytics payload for a teacher's active session/semester, displayed on the
 * Analytics page.
 */
export interface DownloadAnalytics {
    readonly timeSeries: DownloadTimeSeriesPoint[];
    readonly topAttachments: TopDownloadedAttachment[];
}
