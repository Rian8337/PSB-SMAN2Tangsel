import { AcademicSession } from "@psb/shared/types";

/**
 * A service that is responsible for handling academic session related operations.
 */
export interface ISessionService {
    /**
     * Obtains the currently active semester.
     *
     * @returns The active academic session.
     */
    getActive(): Promise<AcademicSession>;
}
