import { ScheduleDTO } from "@psb/shared/types";

/**
 * Parses schedule data returned from backend.
 *
 * @param schedules The schedules.
 * @returns The parsed schedule.
 */
export function parseScheduleData(schedules: ScheduleDTO[]) {
    return schedules.map((schedule) => {
        const startDate = new Date(schedule.startTime);
        const endDate = new Date(schedule.endTime);

        return {
            id: schedule.id,
            day: schedule.day,
            subject: schedule.subject,
            // Math: Hours + (Minutes / 60). e.g., 6 + (30 / 60) = 6.5
            startDecimal: startDate.getHours() + startDate.getMinutes() / 60,
            endDecimal: endDate.getHours() + endDate.getMinutes() / 60,
        } as const;
    });
}

/**
 * Creates a `Date` object from a time string in the format "HH:mm".
 *
 * Note that the date part should be ignored, and only the time part is used. The date of the schedule is determined
 * by the `day` property of the schedule.
 *
 * @param timeStr The time string to create the `Date` object from, in the format "HH:mm".
 * @returns The created `Date` object.
 */
export function createDateFromTime(timeStr: string) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date;
}
