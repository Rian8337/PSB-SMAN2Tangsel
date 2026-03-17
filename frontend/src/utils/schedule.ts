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
