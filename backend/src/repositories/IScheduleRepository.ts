import {
    ScheduleDay,
    ScheduleDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Defines operations for accessing and managing schedule data in the database.
 */
export interface IScheduleRepository {
    /**
     * Obtains a schedule by its ID.
     *
     * @param id The ID of the schedule.
     * @returns The schedule with the specified ID, or `null` if not found.
     */
    findById(id: number): Promise<ScheduleDTO | null>;

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

    /**
     * Creates a new schedule for a class subject.
     *
     * @param classSubjectId The ID of the class subject this schedule is associated with.
     * @param day The day of the schedule, represented as a number from 0 to 6, where 0 is Sunday and 6 is Saturday.
     * @param startTime The time at which the schedule starts. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     * @param endTime The time at which the schedule ends. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     * @returns The ID of the newly created schedule.
     */
    create(
        classSubjectId: number,
        day: ScheduleDay,
        startTime: Date,
        endTime: Date,
    ): Promise<number>;

    /**
     * Updates an existing schedule.
     *
     * @param id The ID of the schedule to update.
     * @param day The day of the schedule, represented as a number from 0 to 6, where 0 is Sunday and 6 is Saturday.
     * @param startTime The time at which the schedule starts. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     * @param endTime The time at which the schedule ends. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     */
    update(
        id: number,
        day: ScheduleDay,
        startTime: Date,
        endTime: Date,
    ): Promise<void>;

    /**
     * Deletes a schedule by its ID.
     *
     * @param id The ID of the schedule to delete.
     */
    delete(id: number): Promise<void>;

    /**
     * Checks if a proposed schedule overlaps with an existing schedule for either
     * the class or the assigned teacher.
     *
     * @param classSubjectId The ID of the class subject this schedule is associated with.
     * @param day The day of the schedule, represented as a number from 0 to 6, where 0 is Sunday and 6 is Saturday.
     * @param startTime The time at which the schedule starts. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     * @param endTime The time at which the schedule ends. Note that the day represented by this timestamp is ignored, and only the time is
     * used. The day of the schedule is determined by the {@param day} parameter.
     * @param excludeScheduleId Used during updates to ignore the schedule being edited.
     */
    hasConflict(
        classSubjectId: number,
        day: ScheduleDay,
        startTime: Date,
        endTime: Date,
        excludeScheduleId?: number,
    ): Promise<boolean>;
}
