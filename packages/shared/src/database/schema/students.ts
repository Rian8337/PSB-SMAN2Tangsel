import { int } from "drizzle-orm/mysql-core";
import { mysqlTable } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { studentClasses } from "./studentClasses";
import { assignmentSubmissions } from "./assignmentSubmissions";

/**
 * The student table.
 */
export const students = mysqlTable("student", {
    /**
     * The ID of the student, which is also the ID of the corresponding user in the {@link users} table.
     */
    userId: int()
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),

    /**
     * The government-issued NISN (National Student Identification Number) of the student.
     *
     * It is a unique 10-digit number assigned to each student in Indonesia.
     */
    nisn: varchar({ length: 10 }).unique("nisn_unique").notNull(),
});

/**
 * Relations for the {@link students} table.
 */
export const studentRelations = relations(students, ({ one, many }) => ({
    /**
     * The assignment submissions that the student has submitted.
     */
    assignmentSubmissions: many(assignmentSubmissions),

    /**
     * The user associated with the student.
     */
    user: one(users, {
        fields: [students.userId],
        references: [users.id],
    }),

    /**
     * The classes that this student is enrolled to.
     */
    classes: many(studentClasses),
}));
