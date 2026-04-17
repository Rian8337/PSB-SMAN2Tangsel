import { ClassSubjectAssignment, Subject } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing subject assignments to classes in the database.
 */
export interface IClassSubjectRepository {
    /**
     * Obtains a list of subjects assigned to a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     *
     * @param classId The unique identifier of the class to obtain assigned subjects for.
     * @param query An optional search query to filter the assigned subjects by code or name.
     * @param limit The maximum number of assigned subjects to return. Defaults to 5.
     * @param offset The number of assigned subjects to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of subjects assigned to the specified class, optionally filtered by the search query and paginated with limit and offset parameters.
     */
    listAssignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<ClassSubjectAssignment[]>;

    /**
     * Lists subjects that are not yet assigned to a specific class for display in the subject selection dropdown when assigning subjects to a class.
     *
     * @param classId The unique identifier of the class to list unassigned subjects for.
     * @param query The search query to filter unassigned subjects by name or code.
     * @param limit The maximum number of unassigned subjects to return. Defaults to 5.
     * @param offset The number of unassigned subjects to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of subjects that are not yet assigned to the specified class, matching the search query.
     */
    listUnassignedSubjects(
        classId: number,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<Subject[]>;

    /**
     * Assigns a subject to a class. If the teacher ID is not provided, the subject will be assigned to the class without a teacher.
     *
     * @param classId The unique identifier of the class to assign the subject to.
     * @param subjectId The unique identifier of the subject to assign to the class.
     * @param teacherId The unique identifier of the teacher to assign to the class subject. If `null`, the subject will be
     * assigned to the class without a teacher.
     */
    assignSubject(
        classId: number,
        subjectId: number,
        teacherId: number | null,
    ): Promise<void>;

    /**
     * Updates the teacher assigned to a class subject. If the teacher ID is not provided, the subject will be unassigned from any teacher.
     *
     * @param classId The unique identifier of the class that the subject is assigned to.
     * @param assignmentId The unique identifier of the class subject assignment to update the assigned teacher for.
     * @param teacherId The unique identifier of the teacher to assign to the class subject. If `null`, the subject will be unassigned from any teacher.
     */
    updateAssignedSubject(
        classId: number,
        assignmentId: number,
        teacherId: number | null,
    ): Promise<void>;

    /**
     * Checks if a class subject assignment has any associated materials or assignments. This is used to prevent deletion of active classes.
     *
     * @param assignmentId The unique identifier of the class subject assignment to check for associated content.
     * @returns A boolean indicating whether the class subject assignment has any associated materials or assignments.
     */
    hasAssociatedContent(assignmentId: number): Promise<boolean>;

    /**
     * Removes a subject assignment from a class.
     *
     * @param classId The unique identifier of the class that the subject is assigned to.
     * @param assignmentId The unique identifier of the class subject assignment to remove.
     */
    unassignSubject(classId: number, assignmentId: number): Promise<void>;
}
