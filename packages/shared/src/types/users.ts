import { administrators, students, teachers, users } from "../database/schema";

/**
 * Available user roles.
 */
export enum UserRole {
    student,
    teacher,
    administrator,
}

/**
 * The type of a user as stored in the database.
 */
export type User = typeof users.$inferSelect;

/**
 * The type of an administrator user.
 */
export type Administrator = User & typeof administrators.$inferSelect;

/**
 * The type of a teacher user.
 */
export type Teacher = User & typeof teachers.$inferSelect;

/**
 * The type of a student user.
 */
export type Student = User & typeof students.$inferSelect;
