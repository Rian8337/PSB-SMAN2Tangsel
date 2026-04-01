import { ValidSemester, ValidSession } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing student data in the database.
 */
export interface IStudentRepository {
    /**
     * Obtains the ID of the class that a student with the given userID is enrolled to in the currently active academic session.
     *
     * @param id The user ID of the student.
     * @returns The ID of the class that the student is enrolled to, or `null` if the student is not enrolled to any class in the active academic session, or if there is no active academic session.
     */
    getClassId(id: number): Promise<number | null>;

    /**
     * Obtains the ID of the class that a student with the given user ID is enrolled to in a specific academic session.
     *
     * @param id The user ID of the student.
     * @param session The academic session in the format "YYYY/YYYY".
     * @param semester The semester of the academic session (1 or 2).
     * @returns The ID of the class that the student is enrolled to, or `null` if the student is not enrolled to any class in the specified academic session, or if the specified academic session does not exist.
     */
    getClassId(
        id: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<number | null>;
}
