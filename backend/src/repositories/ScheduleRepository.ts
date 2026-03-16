import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { classSubjects, schedules, subjects } from "@psb/shared/schema";
import { DrizzleDb, ScheduleDay, ScheduleDTO } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IScheduleRepository } from "./IScheduleRepository";

interface ScheduleQueryResult {
    id: number;
    day: ScheduleDay;
    startTime: Date;
    endTime: Date;
    subjectCode: string;
    subjectName: string;
}

/**
 * Defines operations for accessing and managing schedule data in the database.
 */
@Injectable(dependencyTokens.scheduleRepository)
export class ScheduleRepository
    extends DatabaseRepository
    implements IScheduleRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async findByClassId(classId: number): Promise<ScheduleDTO[]> {
        const records = await this.db
            .select({
                id: schedules.id,
                day: schedules.day,
                startTime: schedules.startTime,
                endTime: schedules.endTime,
                subjectCode: subjects.code,
                subjectName: subjects.name,
            })
            .from(schedules)
            .innerJoin(
                classSubjects,
                eq(schedules.classSubjectId, classSubjects.id),
            )
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(eq(classSubjects.id, classId));

        return this.mapToDTO(records);
    }

    async findByTeacherId(teacherId: number): Promise<ScheduleDTO[]> {
        const records = await this.db
            .select({
                id: schedules.id,
                day: schedules.day,
                startTime: schedules.startTime,
                endTime: schedules.endTime,
                subjectCode: subjects.code,
                subjectName: subjects.name,
            })
            .from(schedules)
            .innerJoin(
                classSubjects,
                eq(schedules.classSubjectId, classSubjects.id),
            )
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(eq(classSubjects.teacherId, teacherId));

        return this.mapToDTO(records);
    }

    private mapToDTO(schedules: ScheduleQueryResult[]): ScheduleDTO[] {
        return schedules.map((s) => ({
            id: s.id,
            day: s.day,
            startTime: s.startTime.getTime(),
            endTime: s.endTime.getTime(),
            subject: {
                code: s.subjectCode,
                name: s.subjectName,
            },
        }));
    }
}
