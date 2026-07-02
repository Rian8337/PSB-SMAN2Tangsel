import { sql } from "drizzle-orm";
import {
    bigint,
    boolean,
    datetime,
    foreignKey,
    index,
    int,
    mysqlTable,
    text,
} from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * The notifications table.
 */
export const notifications = mysqlTable(
    "notification",
    {
        /**
         * The time at which this notification was created.
         */
        createdAt: datetime()
            .default(sql`(now())`)
            .notNull(),

        /**
         * The system-issued identification number of this notification.
         */
        id: bigint({ mode: "number" }).autoincrement().primaryKey(),

        /**
         * The message of this notification.
         */
        message: text().notNull(),

        /**
         * Whether this notification is marked as read.
         */
        read: boolean().default(false).notNull(),

        /**
         * The title of this notification.
         */
        title: text().notNull(),

        /**
         * The actionable URL of this notification, if any.
         */
        url: text(),

        /**
         * The ID of the user this notification belongs to, which is also the ID of the corresponding user
         * in the {@link users} table.
         */
        userId: int().notNull(),
    },
    (table) => [
        index("idx_notification_userId").on(table.userId),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_notification_user",
        }).onDelete("cascade"),
    ],
);
