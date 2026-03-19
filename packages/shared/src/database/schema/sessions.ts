import { relations } from "drizzle-orm";
import {
    boolean,
    mysqlTable,
    primaryKey,
    timestamp,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { ValidSemester } from "../../types";
import { classes } from "./classes";

/**
 * The academic session table.
 */
export const sessions = mysqlTable(
    "session",
    {
        /**
         * Whether the academic session and semester is active.
         *
         * An active session and semester is the one that is currently ongoing. There can only be one active session
         * and semester at a time.
         */
        active: boolean().$type<true | null>().unique(),

        /**
         * The academic session.
         */
        session: varchar({ length: 9 }).notNull(),

        /**
         * The semester.
         */
        semester: tinyint().$type<ValidSemester>().notNull(),

        /**
         * The time at which the academic session and semester starts.
         */
        startTime: timestamp().notNull(),

        /**
         * The time at which the academic session and semester ends.
         */
        endTime: timestamp().notNull(),
    },
    (table) => [primaryKey({ columns: [table.session, table.semester] })],
);

/**
 * Relations for the {@link sessions} table.
 */
export const sessionRelations = relations(sessions, ({ many }) => ({
    /**
     * The classes registered in the academic session and semester.
     */
    classes: many(classes),
}));
