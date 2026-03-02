import z from "zod";
import { insertUserSchema } from "../validator";
import { users } from "../database/schema";

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
 * The type of data required to insert a new user into the database.
 */
export type InsertUser = z.infer<typeof insertUserSchema>;
