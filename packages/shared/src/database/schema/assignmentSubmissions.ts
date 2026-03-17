import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable, timestamp } from "drizzle-orm/mysql-core";
import { assignments } from "./assignments";
import { assignmentSubmissionAttachments } from "./assignmentSubmissionAttachments";
import { students } from "./students";

/**
 * The assignment submissions table.
 */
export const assignmentSubmissions = mysqlTable(
    "assignment_submission",
    {
        /**
         * The system-issued identification number of this assignment submission.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The ID of the assignment this assignment submission is associated with, which is also the ID of the
         * corresponding assignment in the {@link assignments} table.
         */
        assignmentId: int().notNull(),

        /**
         * The time at which this assignment submission was created.
         */
        createdAt: timestamp().defaultNow().notNull(),

        /**
         * The ID of the student who submits this assignment submission, which is also the ID of the corresponding
         * student in the {@link students} table.
         */
        studentId: int().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.assignmentId],
            foreignColumns: [assignments.id],
            name: "fk_assignment_submission_assignment",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.studentId],
            foreignColumns: [students.userId],
            name: "fk_assignment_submission_student",
        }).onDelete("cascade"),
    ],
);

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
