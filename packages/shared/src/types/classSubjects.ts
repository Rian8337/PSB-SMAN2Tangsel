import { classSubjects } from "../database/schema";
import { Subject } from "./subjects";
import { Teacher } from "./users";

/**
 * The type representing a class subject, which is a subject taught in a specific class by a specific teacher, in the database.
 */
export type ClassSubject = typeof classSubjects.$inferSelect;

/**
 * The type representing the assignment of a subject to a class, including the subject details and the assigned teacher (if any),
 * for display in the UI.
 */
export interface ClassSubjectAssignment {
    readonly id: number;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly teacher: Pick<Teacher, "id" | "name"> | null;
}
