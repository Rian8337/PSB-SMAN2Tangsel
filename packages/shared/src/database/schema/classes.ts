import { relations } from "drizzle-orm";
import {
    foreignKey,
    int,
    mysqlTable,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { ValidSemester } from "../../types";
import { sessions } from "./sessions";
import { classSubjects } from "./classSubjects";
import { studentClasses } from "./studentClasses";

/**
 * The class table.
 */
export const classes = mysqlTable(
    "class",
    {
        /**
         * The system-issued identification number of the class.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The name of the class.
         */
        name: varchar({ length: 50 }).notNull(),

        /**
         * The semester this class is registered in.
         */
        semester: tinyint().$type<ValidSemester>().notNull(),

        /**
         * The academic session this class is registered in.
         */
        session: varchar({ length: 9 }).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.session, table.semester],
            foreignColumns: [sessions.session, sessions.semester],
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link classes} table.
 */
export const classRelations = relations(classes, ({ one, many }) => ({
    /**
     * The academic session and semester this class is registered in.
     */
    session: one(sessions, {
        fields: [classes.session, classes.semester],
        references: [sessions.session, sessions.semester],
    }),

    /**
     * The subjects that are taught to this class.
     */
    subjects: many(classSubjects),

    /**
     * The students who are enrolled to this class.
     */
    students: many(studentClasses),
}));
