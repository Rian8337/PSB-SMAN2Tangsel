import { relations } from "drizzle-orm";
import {
    boolean,
    int,
    mysqlTable,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { UserRole } from "../../types";
import { administrators } from "./administrators";
import { students } from "./students";
import { teachers } from "./teachers";
import { index } from "drizzle-orm/mysql-core";

/**
 * Base table for all users.
 */
export const users = mysqlTable(
    "user",
    {
        /**
         * Whether the user is considered active. Inactive users cannot authenticate to the system.
         */
        active: boolean().notNull().default(true),

        /**
         * The system-issued identification number of the user.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The name of the user.
         */
        name: varchar({ length: 100 }).notNull(),

        /**
         * The encrypted password of the user. The maximum length is 72 characters, which is the maximum length of a bcrypt hash.
         */
        password: varchar({ length: 72 }).notNull(),

        /**
         * The role of the user. Maps to the `UserRole` enum:
         * - 0: student
         * - 1: teacher
         * - 2: administrator
         */
        role: tinyint().$type<UserRole>().notNull().default(0),

        /**
         * The identifier of the user.
         *
         * For students, this is the government-issued NISN (National Student Identification Number), which is a unique 10-digit
         * number assigned to each student in Indonesia.
         *
         * For teachers and administrators, this is a school-issued staff ID.
         */
        identifier: varchar({ length: 50 })
            .unique("identifier_unique")
            .notNull(),
    },
    (table) => [
        index("name_idx").on(table.name),
        index("role_idx").on(table.role),
        index("identifier_idx").on(table.identifier),
    ],
);

/**
 * Relations for the {@link users} table.
 */
export const userRelations = relations(users, ({ one }) => ({
    /**
     * The student associated with the user, if the user's role is `student`.
     */
    student: one(students, {
        fields: [users.id],
        references: [students.userId],
    }),

    /**
     * The teacher associated with the user, if the user's role is `teacher`.
     */
    teacher: one(teachers, {
        fields: [users.id],
        references: [teachers.userId],
    }),

    /**
     * The administrator associated with the user, if the user's role is `administrator`.
     */
    administrator: one(administrators, {
        fields: [users.id],
        references: [administrators.userId],
    }),
}));
