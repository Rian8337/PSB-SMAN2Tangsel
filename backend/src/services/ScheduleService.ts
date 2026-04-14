import { ScheduleDTO } from "@psb/shared/types";
import {
    CreateScheduleOptions,
    IScheduleService,
    UpdateScheduleOptions,
} from "./IScheduleService";
import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { IScheduleRepository } from "@/repositories";
import { createEvents, EventAttributes } from "ics";
import { BadRequestError, ConflictError, NotFoundError } from "@/types";

/**
 * A service that is responsible for schedule-related operations.
 */
@Injectable(dependencyTokens.scheduleService)
export class ScheduleService implements IScheduleService {
    constructor(
        @inject(dependencyTokens.scheduleRepository)
        private readonly scheduleRepository: IScheduleRepository,
    ) {}

    async getById(id: number): Promise<ScheduleDTO> {
        const schedule = await this.scheduleRepository.findById(id);

        if (!schedule) {
            throw new NotFoundError("scheduleService.scheduleNotFound");
        }

        return schedule;
    }

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

    async create(options: CreateScheduleOptions): Promise<void> {
        this.validateTimeOrder(options.startTime, options.endTime);

        const hasConflict = await this.scheduleRepository.hasConflict(
            options.classSubjectId,
            options.day,
            options.startTime,
            options.endTime,
        );

        if (hasConflict) {
            throw new ConflictError("scheduleService.scheduleConflict");
        }

        await this.scheduleRepository.create(
            options.classSubjectId,
            options.day,
            options.startTime,
            options.endTime,
        );
    }

    async update(options: UpdateScheduleOptions): Promise<void> {
        this.validateTimeOrder(options.startTime, options.endTime);

        const existingSchedule = await this.getById(options.id);

        const hasConflict = await this.scheduleRepository.hasConflict(
            existingSchedule.classSubjectId,
            options.day,
            options.startTime,
            options.endTime,
            options.id,
        );

        if (hasConflict) {
            throw new ConflictError("scheduleService.scheduleConflict");
        }

        await this.scheduleRepository.update(
            options.id,
            options.day,
            options.startTime,
            options.endTime,
        );
    }

    async delete(id: number): Promise<void> {
        await this.scheduleRepository.delete(id);
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

    private validateTimeOrder(startTime: Date, endTime: Date) {
        if (startTime >= endTime) {
            throw new BadRequestError("scheduleService.invalidTimeOrder");
        }
    }
}
