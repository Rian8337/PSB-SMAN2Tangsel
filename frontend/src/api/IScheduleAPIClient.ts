import { ScheduleDTO } from "@psb/shared/types";

export interface CreateScheduleOptions {
    readonly classSubjectId: number;
    readonly day: number;
    readonly startTime: Date;
    readonly endTime: Date;
}

export interface UpdateScheduleOptions {
    readonly id: number;
    readonly day: number;
    readonly startTime: Date;
    readonly endTime: Date;
}

/**
 * Provides operations for schedule-related API calls.
 */
export interface IScheduleAPIClient {
    /**
     * Fetches a schedule by its ID.
     *
     * @param id The ID of the schedule to fetch.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to fetch the schedule.
     * @returns The schedule with the specified ID.
     */
    getById(id: number, signal?: AbortSignal): Promise<ScheduleDTO>;

    /**
     * Fetches the weekly schedule of the authenticated user.
     *
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to fetch the weekly schedule.
     * @returns The weekly schedule of the user.
     */
    getSchedule(signal?: AbortSignal): Promise<ScheduleDTO[]>;

    /**
     * Downloads the weekly schedule of the authenticated user as an iCalendar file (`.ics`).
     *
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to download the weekly schedule.
     * @returns An object containing the downloaded schedule as a `Blob` and an optional filename.
     */
    download(
        signal?: AbortSignal,
    ): Promise<Readonly<{ blob: Blob; filename?: string }>>;

    /**
     * Creates a new schedule for a class subject.
     *
     * @param options Options for creating the schedule.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to create the schedule.
     */
    createSchedule(options: CreateScheduleOptions): Promise<void>;

    /**
     * Updates an existing schedule.
     *
     * @param options Options for updating the schedule.
     */
    updateSchedule(options: UpdateScheduleOptions): Promise<void>;

    /**
     * Deletes a schedule.
     *
     * @param id The ID of the schedule to delete.
     */
    deleteSchedule(id: number): Promise<void>;
}
