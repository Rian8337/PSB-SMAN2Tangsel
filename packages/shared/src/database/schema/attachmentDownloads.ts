import { relations, sql } from "drizzle-orm";
import { datetime, foreignKey, int, mysqlTable } from "drizzle-orm/mysql-core";
import { attachments } from "./attachments";
import { users } from "./users";

/**
 * The attachment download log table.
 *
 * Unlike most join tables in this schema, this is append-only and uses a surrogate autoincrement
 * primary key rather than a composite one: the same user downloading the same attachment multiple
 * times must produce multiple rows, since every download is logged individually.
 */
export const attachmentDownloads = mysqlTable(
    "attachment_download",
    {
        id: int().autoincrement().primaryKey(),

        /**
         * The ID of the downloaded attachment, which is also the ID of the corresponding attachment in
         * the {@link attachments} table.
         */
        attachmentId: int().notNull(),

        /**
         * The ID of the user who downloaded the attachment, which is also the ID of the corresponding
         * user in the {@link users} table.
         */
        userId: int().notNull(),

        /**
         * The time at which this download was recorded.
         */
        downloadedAt: datetime({ fsp: 3 })
            .default(sql`(now(3))`)
            .notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.attachmentId],
            foreignColumns: [attachments.id],
            name: "fk_attachment_download_attachment",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_attachment_download_user",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link attachmentDownloads} table.
 */
export const attachmentDownloadRelations = relations(
    attachmentDownloads,
    ({ one }) => ({
        attachment: one(attachments, {
            fields: [attachmentDownloads.attachmentId],
            references: [attachments.id],
        }),
        user: one(users, {
            fields: [attachmentDownloads.userId],
            references: [users.id],
        }),
    }),
);
