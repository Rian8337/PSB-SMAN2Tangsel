import { relations } from "drizzle-orm";
import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { assignments } from "./assignments";
import { attachments } from "./attachments";

/**
 * The assignment attachments table.
 *
 * This links assignments with their respective attachments.
 */
export const assignmentAttachments = mysqlTable("assignment_attachment", {
    /**
     * The ID of the attachment this attachment is associated with, which is also the ID of the
     * corresponding attachment in the {@link attachments} table.
     */
    attachmentId: int()
        .references(() => attachments.id, {
            onDelete: "cascade",
        })
        .unique("attachment_id_unique")
        .notNull(),

    /**
     * The ID of the assignment this attachment is associated with, which is also the ID of the
     * corresponding assignment in the {@link assignments} table.
     */
    assignmentId: int()
        .references(() => assignments.id, {
            onDelete: "cascade",
        })
        .notNull(),
});

/**
 * Relations for the {@link assignmentAttachments} table.
 */
export const assignmentAttachmentRelations = relations(
    assignmentAttachments,
    ({ one }) => ({
        /**
         * The assignment associated with this attachment.
         */
        assignment: one(assignments, {
            fields: [assignmentAttachments.assignmentId],
            references: [assignments.id],
        }),

        /**
         * The underlying attachment.
         */
        attachment: one(attachments, {
            fields: [assignmentAttachments.attachmentId],
            references: [attachments.id],
        }),
    }),
);
