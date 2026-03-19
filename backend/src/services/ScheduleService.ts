import { ScheduleDTO } from "@psb/shared/types";
import { IScheduleService } from "./IScheduleService";
import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { IScheduleRepository } from "@/repositories";
import { createEvents, EventAttributes } from "ics";

/**
 * A service that is responsible for schedule-related operations.
 */
@Injectable(dependencyTokens.scheduleService)
export class ScheduleService implements IScheduleService {
    constructor(
        @inject(dependencyTokens.scheduleRepository)
        private readonly scheduleRepository: IScheduleRepository,
    ) {}

    getClassSchedule(classId: number): Promise<ScheduleDTO[]> {
        return this.scheduleRepository.findByClassId(classId);
    }

    getTeacherSchedule(teacherId: number): Promise<ScheduleDTO[]> {
        return this.scheduleRepository.findByTeacherId(teacherId);
    }

    generateIcsFile(
        schedules: readonly ScheduleDTO[],
        sessionStart: Date,
        sessionEnd: Date,
    ): Buffer {
        if (schedules.length === 0) {
            return Buffer.from(createEvents([]).value ?? "");
        }

        // Format the end date for the ICS Recurrence Rule (YYYYMMDDTHHMMSSZ).
        const untilDateStr =
            sessionEnd.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        const events: EventAttributes[] = schedules.map((schedule) => {
            const firstClassDate = this.getFirstDateOfDay(
                sessionStart,
                schedule.day,
            );

            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);

            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();
            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();

            const durationMinutes =
                endHour * 60 + endMinute - (startHour * 60 + startMinute);

            return {
                title: `(${schedule.subject.code}) ${schedule.subject.name}`,
                start: [
                    firstClassDate.getFullYear(),
                    firstClassDate.getMonth() + 1,
                    firstClassDate.getDate(),
                    startHour,
                    startMinute,
                ],
                duration: { minutes: durationMinutes },
                recurrenceRule: `FREQ=WEEKLY;UNTIL=${untilDateStr}`,
                busyStatus: "BUSY",
            };
        });

        const { error, value } = createEvents(events);

        if (error || !value) {
            throw new Error(
                `Failed to generate iCalendar file: ${error?.message ?? "value is undefined"}.`,
            );
        }

        return Buffer.from(value);
    }

    private getFirstDateOfDay(
        sessionStartDate: Date,
        targetDayOfWeek: number,
    ): Date {
        const firstDate = new Date(sessionStartDate.getTime());
        const startDayOfWeek = firstDate.getDay();

        // Calculate how many days we need to fast-forward to hit our target day.
        const daysToWait = (targetDayOfWeek - startDayOfWeek + 7) % 7;

        firstDate.setDate(firstDate.getDate() + daysToWait);

        return firstDate;
    }
}
