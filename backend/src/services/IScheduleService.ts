import { ScheduleDTO } from "@psb/shared/types";

/**
 * A service that is responsible for schedule-related operations.
 */
export interface IScheduleService {
    /**
     * Fetches the weekly schedule of a class.
     *
     * @param classId The ID of the class.
     * @returns The weekly schedule of the class.
     */
    getClassSchedule(classId: number): Promise<ScheduleDTO[]>;

    /**
     * Fetches the weekly schedule of a teacher.
     *
     * @param teacherId The user ID of the teacher.
     * @returns The weekly schedule of the teacher.
     */
    getTeacherSchedule(teacherId: number): Promise<ScheduleDTO[]>;
}
