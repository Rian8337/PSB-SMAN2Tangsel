import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable } from "drizzle-orm/mysql-core";
import { classSubjects } from "./classSubjects";
import { users } from "./users";

/**
 * The teacher table.
 */
export const teachers = mysqlTable(
    "teacher",
    {
        /**
         * The ID of the teacher, which is also the ID of the corresponding user in the {@link users} table.
         */
        userId: int().primaryKey(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_teacher_user",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link teachers} table.
 */
export const teacherRelations = relations(teachers, ({ one, many }) => ({
    /**
     * The user associated with the teacher.
     */
    user: one(users, {
        fields: [teachers.userId],
        references: [users.id],
    }),

    /**
     * The classes that the teacher teaches.
     */
    classes: many(classSubjects),
}));
