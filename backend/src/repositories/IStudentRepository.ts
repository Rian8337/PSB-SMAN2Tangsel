import { LoginResult, StudentSessionData } from "@/types";
import { Student } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing student data in the database.
 */
export interface IStudentRepository {
    /**
     * Finds a student by their NISN (National Student Identification Number).
     *
     * @param nisn The NISN of the student to find.
     * @returns The student with the specified NISN, or `null` if no such student exists.
     */
    findByNISN(nisn: string): Promise<Student | null>;

    /**
     * Fetches data necessary to create a login session for a student.
     *
     * @param nisn The NISN of the student.
     * @returns The login session data of the student, or `null` if no such student exists.
     */
    getLoginData(
        nisn: string,
    ): Promise<LoginResult<Student, StudentSessionData> | null>;
}
