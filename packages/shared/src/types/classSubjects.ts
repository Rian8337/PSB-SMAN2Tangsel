import { classSubjects } from "../database/schema";

/**
 * The type representing a class subject, which is a subject taught in a specific class by a specific teacher, in the database.
 */
export type ClassSubject = typeof classSubjects.$inferSelect;
