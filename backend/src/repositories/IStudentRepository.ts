import { Student } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing student data in the database.
 */
export interface IStudentRepository {
    /**
     * Finds a student by their NISN (National Student Identification Number).
     *
     * @param nisn The NISN of the student to find.
     * @return The student with the specified NISN, or `null` if no such student exists.
     */
    findByNISN(nisn: string): Promise<Student | null>;
}
