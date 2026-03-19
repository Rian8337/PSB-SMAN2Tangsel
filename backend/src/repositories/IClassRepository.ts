/**
 * Defines operations for accessing and managing class data in the database.
 */
export interface IClassRepository {
    /**
     * Obtains the user IDs of students enrolled in a class.
     *
     * @param classId The ID of the class.
     * @returns The user IDs of students enrolled in the class.
     */
    getEnrolledStudentIds(classId: number): Promise<number[]>;
}
