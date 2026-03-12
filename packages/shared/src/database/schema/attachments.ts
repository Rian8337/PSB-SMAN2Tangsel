import { relations } from "drizzle-orm";
import { int, mysqlTable, text } from "drizzle-orm/mysql-core";
import { materialAttachments } from "./materialAttachments";

/**
 * The attachment table.
 */
export const attachments = mysqlTable("attachment", {
    /**
     * The system-issued identification number of the attachment.
     */
    id: int().autoincrement().primaryKey(),

    /**
     * The name of the file represented by this attachment.
     */
    name: text().notNull(),

    /**
     * The path to the file represented by this attachment, relative to the root of the file storage.
     *
     * For example, if the file is stored at `storage/attachments/12345.pdf`, the path would be `attachments/12345.pdf`.
     */
    path: text().unique("path_unique").notNull(),
});

/**
 * Relations for the {@link attachments} table.
 */
export const attachmentRelations = relations(attachments, ({ many }) => ({
    /**
     * Attachments that belong to materials.
     */
    materialAttachments: many(materialAttachments),
}));
