import { ScheduleDTO } from "@psb/shared/types";

/**
 * Provides operations for schedule-related API calls.
 */
export interface IScheduleAPIClient {
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
}
