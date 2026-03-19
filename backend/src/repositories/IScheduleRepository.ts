import { ScheduleDTO, ValidSemester, ValidSession } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing schedule data in the database.
 */
export interface IScheduleRepository {
    /**
     * Fetches the weekly schedule of a class.
     *
     * @param classId The ID of the class.
     * @returns The weekly schedule of the class.
     */
    findByClassId(classId: number): Promise<ScheduleDTO[]>;

    /**
     * Fetches the weekly schedule of a teacher.
     *
     * @param teacherId The user ID of the teacher.
     * @returns The weekly schedule of the teacher.
     */
    findByTeacherId(teacherId: number): Promise<ScheduleDTO[]>;

    /**
     * Fetches the weekly schedule of a teacher.
     *
     * @param teacherId The user ID of the teacher.
     * @param session The academic session.
     * @param semester The semester.
     * @returns The weekly schedule of the teacher for the specified academic session and semester.
     */
    findByTeacherId(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<ScheduleDTO[]>;
}
