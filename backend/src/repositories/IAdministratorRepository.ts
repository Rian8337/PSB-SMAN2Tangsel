import { Administrator } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing administrator data in the database.
 */
export interface IAdministratorRepository {
    /**
     * Finds an administrator by their staff ID.
     *
     * @param staffId The staff ID of the administrator.
     * @return The administrator with the specified staff ID, or `null` if no such administrator exists.
     */
    findByStaffId(staffId: number): Promise<Administrator | null>;
}
