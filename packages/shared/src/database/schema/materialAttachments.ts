import { relations } from "drizzle-orm";
import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { attachments } from "./attachments";
import { materials } from "./materials";

/**
 * The material attachments table.
 *
 * This links materials with their respective attachments.
 */
export const materialAttachments = mysqlTable("material_attachment", {
    /**
     * The ID of the underlying attachment this attachment is associated with, which is also the ID of the
     * corresponding attachment in the {@link attachments} table.
     */
    attachmentId: int()
        .references(() => attachments.id, { onDelete: "cascade" })
        .unique("attachment_id_unique")
        .notNull(),

    /**
     * The ID of the material this attachment is associated with, which is also the ID of the
     * corresponding material in the {@link materials} table.
     */
    materialId: int()
        .references(() => materials.id, { onDelete: "cascade" })
        .notNull(),
});

/**
 * Relations for the {@link materialAttachments} table.
 */
export const materialAttachmentRelations = relations(
    materialAttachments,
    ({ one }) => ({
        /**
         * The underlying attachment.
         */
        attachment: one(attachments, {
            fields: [materialAttachments.attachmentId],
            references: [attachments.id],
        }),

        /**
         * The material associated with this attachment.
         */
        material: one(materials, {
            fields: [materialAttachments.materialId],
            references: [materials.id],
        }),
    }),
);
