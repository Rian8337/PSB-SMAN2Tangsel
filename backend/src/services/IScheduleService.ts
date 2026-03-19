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

    /**
     * Generates an iCalendar file for a weekly schedule.
     *
     * @param schedules The weekly schedule to generate the iCalendar file for.
     * @param sessionStart The date at which the weekly schedule starts.
     * @param sessionEnd The date at which the weekly schedule ends.
     * @returns The generated iCalendar file as a buffer.
     */
    generateIcsFile(
        schedules: readonly ScheduleDTO[],
        sessionStart: Date,
        sessionEnd: Date,
    ): Buffer;
}
