import { relations } from "drizzle-orm";
import { int, mysqlTable, primaryKey } from "drizzle-orm/mysql-core";
import { classes } from "./classes";
import { students } from "./students";
import { foreignKey } from "drizzle-orm/mysql-core";

/**
 * The student class table, which represents the many-to-many relationship between students and classes.
 *
 * This represents the students that are enrolled in a class.
 */
export const studentClasses = mysqlTable(
    "student_class",
    {
        /**
         * The ID of the class, which is also the ID of the corresponding class in the {@link classes} table.
         */
        classId: int().notNull(),

        /**
         * The ID of the student, which is also the ID of the corresponding student in the {@link students} table.
         */
        studentId: int().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.classId, table.studentId] }),
        foreignKey({
            columns: [table.classId],
            foreignColumns: [classes.id],
            name: "fk_student_class_class",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.studentId],
            foreignColumns: [students.userId],
            name: "fk_student_class_student",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link studentClasses} table.
 */
export const studentClassRelations = relations(studentClasses, ({ one }) => ({
    /**
     * The class associated with the student class.
     */
    class: one(classes, {
        fields: [studentClasses.classId],
        references: [classes.id],
    }),

    /**
     * The student associated with the student class.
     */
    student: one(students, {
        fields: [studentClasses.studentId],
        references: [students.userId],
    }),
}));
