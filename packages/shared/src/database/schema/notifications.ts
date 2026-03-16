import { text } from "drizzle-orm/mysql-core";
import { int } from "drizzle-orm/mysql-core";
import { boolean } from "drizzle-orm/mysql-core";
import { bigint } from "drizzle-orm/mysql-core";
import { mysqlTable, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { index } from "drizzle-orm/mysql-core";

/**
 * The notifications table.
 */
export const notifications = mysqlTable(
    "notification",
    {
        /**
         * The time at which this notification was created.
         */
        createdAt: timestamp().defaultNow().notNull(),

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
        userId: int()
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
    },
    (table) => [index("idx_notification_userId").on(table.userId)],
);
