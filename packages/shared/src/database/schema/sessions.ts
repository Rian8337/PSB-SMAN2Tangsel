import {
    mysqlTable,
    primaryKey,
    timestamp,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { ValidSemester } from "../../types";
import { relations } from "drizzle-orm";
import { classes } from "./classes";

/**
 * The academic session table.
 */
export const session = mysqlTable(
    "session",
    {
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
 * Relations for the {@link session} table.
 */
export const sessionRelations = relations(session, ({ many }) => ({
    /**
     * The classes registered in the academic session and semester.
     */
    classes: many(classes),
}));
