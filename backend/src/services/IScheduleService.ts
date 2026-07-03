import {
    ScheduleDay,
    ScheduleDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

export interface CreateScheduleOptions {
    readonly classSubjectId: number;
    readonly day: ScheduleDay;
    readonly startTime: Date;
    readonly endTime: Date;
}

export interface UpdateScheduleOptions {
    readonly id: number;
    readonly day: ScheduleDay;
    readonly startTime: Date;
    readonly endTime: Date;
}

/**
 * A service that is responsible for schedule-related operations.
 */
export interface IScheduleService {
    /**
     * Fetches a schedule by its ID.
     *
     * @param id The ID of the schedule to fetch.
     * @returns The schedule with the specified ID.
     */
    getById(id: number): Promise<ScheduleDTO>;

    /**
     * Fetches the weekly schedule of a class.
     *
     * @param classId The ID of the class.
     * @returns The weekly schedule of the class.
     */
    getClassSchedule(classId: number): Promise<ScheduleDTO[]>;

    /**
     * Fetches the weekly schedule of a teacher, optionally scoped to a specific session.
     * If session and semester are omitted, the active session is used.
     *
     * @param teacherId The user ID of the teacher.
     * @param session The academic session to filter by.
     * @param semester The semester to filter by.
     * @returns The weekly schedule of the teacher.
     */
    getTeacherSchedule(
        teacherId: number,
        session?: ValidSession,
        semester?: ValidSemester,
    ): Promise<ScheduleDTO[]>;

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

    /**
     * Creates a new schedule for a class subject.
     *
     * @param options Options for creating the schedule.
     */
    create(options: CreateScheduleOptions): Promise<void>;

    /**
     * Updates an existing schedule.
     *
     * @param options Options for updating the schedule.
     */
    update(options: UpdateScheduleOptions): Promise<void>;

    /**
     * Deletes a schedule.
     *
     * @param id The ID of the schedule to delete.
     */
    delete(id: number): Promise<void>;
}
