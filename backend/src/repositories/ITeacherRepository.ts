import { Teacher } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing teacher data in the database.
 */
export interface ITeacherRepository {
    /**
     * Finds a teacher by their staff ID.
     *
     * @param staffId The staff ID of the teacher.
     * @return The teacher with the specified staff ID, or `null` if no such teacher exists.
     */
    findByStaffId(staffId: number): Promise<Teacher | null>;
}
