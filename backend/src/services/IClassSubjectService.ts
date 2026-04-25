import {
    ClassSubjectAssignment,
    MySubjectDTO,
    Subject,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * A service that is responsible for handling operations related to subject management of classes.
 */
export interface IClassSubjectService {
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
     * Obtains a list of subjects taught by a specific teacher in a specific academic session and semester, optionally filtered by a search query and paginated.
     *
     * @param teacherId The unique identifier of the teacher to obtain taught subjects for.
     * @param session The academic session to filter subjects by.
     * @param semester The semester of the academic session to filter subjects by.
     * @param query An optional search query to filter the subjects by code or name.
     * @param limit The maximum number of subjects to return. Defaults to 5.
     * @param offset The number of subjects to skip before starting to collect the result set. Defaults to 0.
     * @returns A list of subjects taught by the teacher, optionally filtered by the search query and paginated.
     */
    listAssignedSubjectsForTeacher(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<MySubjectDTO[]>;

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
     * Removes a subject assignment from a class, effectively unassigning the subject from the class. This operation is only possible if there are no
     * assignments and materials associated with the class subject assignment.
     *
     * @param classId The unique identifier of the class that the subject is assigned to.
     * @param assignmentId The unique identifier of the class subject assignment to remove.
     */
    unassignSubject(classId: number, assignmentId: number): Promise<void>;
}
