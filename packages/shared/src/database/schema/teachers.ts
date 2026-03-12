import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

/**
 * The teacher table.
 */
export const teachers = mysqlTable("teacher", {
    /**
     * The ID of the teacher, which is also the ID of the corresponding user in the `user` table.
     */
    userId: int()
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),

    /**
     * The school-issued staff ID of the teacher.
     */
    staffId: int().unique("staffid_unique").notNull(),
});

/**
 * Relations for the {@link teachers} table.
 */
export const teacherRelations = relations(teachers, ({ one }) => ({
    /**
     * The user associated with the teacher.
     */
    user: one(users, {
        fields: [teachers.userId],
        references: [users.id],
    }),
}));
