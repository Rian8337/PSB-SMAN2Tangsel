import { ScheduleDTO } from "@psb/shared/types";
import { IScheduleService } from "./IScheduleService";
import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";
import { IScheduleRepository } from "@/repositories";

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
}
