import { relations } from "drizzle-orm";
import { boolean, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { classSubjects } from "./classSubjects";
import { index } from "drizzle-orm/mysql-core";

/**
 * The subject table.
 */
export const subjects = mysqlTable(
    "subject",
    {
        /**
         * The system-issued identification number of the subject.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The code of the subject.
         */
        code: varchar({ length: 15 }).unique("code_unique").notNull(),

        /**
         * The name of the subject.
         */
        name: varchar({ length: 50 }).notNull(),

        /**
         * Whether the subject is active.
         *
         * Inactive subjects will not appear in the subject selection dropdown when assigning subjects to a class, but will
         * still be visible in the subject management page.
         */
        active: boolean().notNull().default(true),
    },
    (table) => [index("active_name_idx").on(table.active, table.name)],
);

/**
 * Relations for the {@link subjects} table.
 */
export const subjectRelations = relations(subjects, ({ many }) => ({
    /**
     * The classes that are taking this subject.
     */
    classes: many(classSubjects),
}));
