import { assignments } from "../database/schema";
import { Subject } from "./subjects";

/**
 * The type of an assignment as stored in the database.
 */
export type Assignment = typeof assignments.$inferSelect;

/**
 * An attachment entry as shown in the assignment detail page.
 */
export interface SubjectAssignmentAttachment {
    readonly id: number;
    readonly name: string;
}

/**
 * An attachment entry for an assignment submission.
 */
export interface SubjectAssignmentSubmissionAttachment {
    readonly id: number;
    readonly name: string;
}

/**
 * A student's submission for an assignment, as shown in the assignment detail page.
 */
export interface SubjectAssignmentSubmission {
    readonly id: number;
    readonly submittedAt: string;
    readonly attachments: SubjectAssignmentSubmissionAttachment[];
}

/**
 * The detailed data for a single assignment, displayed to a student. Includes the student's own
 * submission if one exists.
 */
export interface StudentSubjectAssignment {
    readonly id: number;
    readonly classSubjectId: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly title: string;
    readonly description: string | null;
    readonly dueAt: string | null;
    readonly createdAt: string;
    readonly lastUpdatedAt: string;
    readonly attachments: SubjectAssignmentAttachment[];
    readonly submission: SubjectAssignmentSubmission | null;
}

/**
 * The detailed data for a single assignment, displayed to a teacher. Includes the visibility flag
 * but no submission data.
 */
export interface TeacherSubjectAssignment {
    readonly id: number;
    readonly classSubjectId: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly title: string;
    readonly description: string | null;
    readonly dueAt: string | null;
    readonly visible: boolean;
    readonly createdAt: string;
    readonly lastUpdatedAt: string;
    readonly attachments: SubjectAssignmentAttachment[];
}
