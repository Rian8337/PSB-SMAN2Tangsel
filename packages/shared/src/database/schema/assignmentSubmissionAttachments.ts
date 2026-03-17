import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable } from "drizzle-orm/mysql-core";
import { assignmentSubmissions } from "./assignmentSubmissions";
import { attachments } from "./attachments";

/**
 * The assignment submission attachments table.
 *
 * This links assignment submissions with their respective attachments.
 */
export const assignmentSubmissionAttachments = mysqlTable(
    "assignment_submission_attachment",
    {
        /**
         * The ID of the attachment this attachment is associated with, which is also the ID of the
         * corresponding attachment in the {@link attachments} table.
         */
        attachmentId: int().unique("attachment_id_unique").notNull(),

        /**
         * The ID of the submission this attachment is associated with, which is also the ID of the
         * corresponding submission in the {@link assignmentSubmissions} table.
         */
        submissionId: int().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.attachmentId],
            foreignColumns: [attachments.id],
            name: "fk_assignment_submission_attachment_attachment",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.submissionId],
            foreignColumns: [assignmentSubmissions.id],
            name: "fk_assignment_submission_attachment_submission",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link assignmentSubmissionAttachments} table.
 */
export const assignmentSubmissionAttachmentRelations = relations(
    assignmentSubmissionAttachments,
    ({ one }) => ({
        /**
         * The underlying attachment.
         */
        attachment: one(attachments, {
            fields: [assignmentSubmissionAttachments.attachmentId],
            references: [attachments.id],
        }),

        /**
         * The submission associated with this attachment.
         */
        submission: one(assignmentSubmissions, {
            fields: [assignmentSubmissionAttachments.submissionId],
            references: [assignmentSubmissions.id],
        }),
    }),
);
