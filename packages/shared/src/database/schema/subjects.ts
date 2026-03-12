import { relations } from "drizzle-orm";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { classSubjects } from "./classSubjects";

/**
 * The subject table.
 */
export const subjects = mysqlTable("subject", {
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
});

/**
 * Relations for the {@link subjects} table.
 */
export const subjectRelations = relations(subjects, ({ many }) => ({
    /**
     * The classes that are taking this subject.
     */
    classes: many(classSubjects),
}));
