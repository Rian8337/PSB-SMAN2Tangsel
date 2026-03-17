import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { assignmentSubmissions } from "./assignmentSubmissions";
import { studentClasses } from "./studentClasses";
import { users } from "./users";

/**
 * The student table.
 */
export const students = mysqlTable(
    "student",
    {
        /**
         * The ID of the student, which is also the ID of the corresponding user in the {@link users} table.
         */
        userId: int().primaryKey(),

        /**
         * The government-issued NISN (National Student Identification Number) of the student.
         *
         * It is a unique 10-digit number assigned to each student in Indonesia.
         */
        nisn: varchar({ length: 10 }).unique("nisn_unique").notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_student_user",
        }).onDelete("cascade"),
    ],
);

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
