import { Assignment } from "./assignment";
import { Class } from "./classes";
import { Material } from "./materials";
import { Subject } from "./subjects";

/**
 * A subject entry as shown in the subject dashboard.
 */
export type SubjectDashboardSubject = Pick<Subject, "id" | "code" | "name">;

/**
 * A class entry as shown in the subject dashboard.
 */
export type SubjectDashboardClass = Pick<Class, "id" | "name" | "session" | "semester">;

/**
 * A material entry as shown in the subject dashboard.
 */
export type SubjectDashboardMaterial = Pick<
    Material,
    "id" | "title" | "description" | "visible"
>;

/**
 * An assignment entry as shown in the subject dashboard.
 */
export type SubjectDashboardAssignment = Pick<
    Assignment,
    "id" | "title" | "visible"
>;

/**
 * The dashboard data for a class subject, displayed to students and teachers.
 */
export interface SubjectDashboard {
    readonly subject: SubjectDashboardSubject;
    readonly class: SubjectDashboardClass;
    readonly materials: SubjectDashboardMaterial[];
    readonly assignments: SubjectDashboardAssignment[];
}
