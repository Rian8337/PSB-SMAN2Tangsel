import { Class } from "./classes";
import { Subject } from "./subjects";

/**
 * Aggregate submission-status counts across a teacher's visible assignments within a session/semester.
 */
export interface SubmissionStatusSummary {
    /**
     * Submitted on or before the deadline (or the assignment has no deadline).
     */
    readonly onTime: number;

    /**
     * Submitted after the deadline.
     */
    readonly late: number;

    /**
     * Not submitted, and the deadline has passed.
     */
    readonly missing: number;

    /**
     * Not submitted, but not yet due (or the assignment has no deadline). Excluded from "needing attention".
     */
    readonly pending: number;
}

/**
 * A student with at least one late or missing submission within a single class-subject, ranked by
 * severity (late + missing count) for the "students needing attention" list.
 */
export interface StudentSubmissionConcern {
    readonly studentId: number;
    readonly studentIdentifier: string;
    readonly studentName: string;
    readonly lateCount: number;
    readonly missingCount: number;
    readonly classSubjectId: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly class: Pick<Class, "id" | "name">;
}

/**
 * The full submission analytics payload for a teacher's active session/semester, displayed on the
 * Analytics page.
 */
export interface SubmissionAnalytics {
    readonly summary: SubmissionStatusSummary;
    readonly concerningStudents: StudentSubmissionConcern[];
}
