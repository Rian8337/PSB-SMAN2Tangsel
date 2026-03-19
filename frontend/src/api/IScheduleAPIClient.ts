import { ScheduleDTO } from "@psb/shared/types";

/**
 * Provides operations for schedule-related API calls.
 */
export interface IScheduleAPIClient {
    /**
     * Fetches the weekly schedule of the authenticated user.
     *
     * @returns The weekly schedule of the user.
     */
    getSchedule(): Promise<ScheduleDTO[]>;

    /**
     * Downloads the weekly schedule of the authenticated user as an iCalendar file (`.ics`).
     */
    download(): Promise<Readonly<{ blob: Blob; filename?: string }>>;
}
