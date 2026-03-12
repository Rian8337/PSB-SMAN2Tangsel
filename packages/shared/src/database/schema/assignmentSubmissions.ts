import { relations } from "drizzle-orm";
import { int, mysqlTable, timestamp } from "drizzle-orm/mysql-core";
import { assignments } from "./assignments";
import { students } from "./students";
import { assignmentSubmissionAttachments } from "./assignmentSubmissionAttachments";

/**
 * The assignment submissions table.
 */
export const assignmentSubmissions = mysqlTable("assignment_submission", {
    /**
     * The system-issued identification number of this assignment submission.
     */
    id: int().autoincrement().primaryKey(),

    /**
     * The ID of the assignment this assignment submission is associated with, which is also the ID of the
     * corresponding assignment in the {@link assignments} table.
     */
    assignmentId: int().references(() => assignments.id, {
        onDelete: "cascade",
    }),

    /**
     * The time at which this assignment submission was created.
     */
    createdAt: timestamp().defaultNow().notNull(),

    /**
     * The ID of the student who submits this assignment submission, which is also the ID of the corresponding
     * student in the {@link students} table.
     */
    studentId: int()
        .references(() => students.userId, { onDelete: "cascade" })
        .notNull(),
});

/**
 * Relations for the {@link assignmentSubmissions} table.
 */
export const assignmentSubmissionRelations = relations(
    assignmentSubmissions,
    ({ one, many }) => ({
        /**
         * The assignment associated with this assignment submission.
         */
        assignment: one(assignments, {
            fields: [assignmentSubmissions.assignmentId],
            references: [assignments.id],
        }),

        /**
         * The attachments of this assignment submission.
         */
        attachments: many(assignmentSubmissionAttachments),
    }),
);
