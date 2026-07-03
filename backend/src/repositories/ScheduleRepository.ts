import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    classes,
    classSubjects,
    schedules,
    sessions,
    subjects,
} from "@psb/shared/schema";
import {
    DrizzleDb,
    ScheduleDay,
    ScheduleDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, eq, gt, lt, ne, or } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IScheduleRepository } from "./IScheduleRepository";

interface ScheduleQueryResult {
    id: number;
    classSubjectId: number;
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

    findById(id: number): Promise<ScheduleDTO | null> {
        return this.db
            .select({
                id: schedules.id,
                classSubjectId: schedules.classSubjectId,
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
            .where(eq(schedules.id, id))
            .then((res) => this.mapToDTO(res).at(0) ?? null);
    }

    async findByClassId(classId: number): Promise<ScheduleDTO[]> {
        const records = await this.db
            .select({
                id: schedules.id,
                classSubjectId: schedules.classSubjectId,
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
            .where(eq(classSubjects.classId, classId));

        return this.mapToDTO(records);
    }

    async findByTeacherId(
        teacherId: number,
        session?: ValidSession,
        semester?: ValidSemester,
    ): Promise<ScheduleDTO[]> {
        const sessionJoinCondition = [
            eq(classes.session, sessions.session),
            eq(classes.semester, sessions.semester),
        ];

        if (session && semester) {
            sessionJoinCondition.push(
                eq(sessions.session, session),
                eq(sessions.semester, semester),
            );
        } else {
            sessionJoinCondition.push(eq(sessions.active, true));
        }

        const records: ScheduleQueryResult[] = await this.db
            .select({
                id: schedules.id,
                classSubjectId: schedules.classSubjectId,
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
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .innerJoin(sessions, and(...sessionJoinCondition))
            .where(eq(classSubjects.teacherId, teacherId));

        return this.mapToDTO(records);
    }

    async create(
        classSubjectId: number,
        day: ScheduleDay,
        startTime: Date,
        endTime: Date,
    ): Promise<number> {
        const [result] = await this.db.insert(schedules).values({
            classSubjectId,
            day,
            startTime,
            endTime,
        });

        return result.insertId;
    }

    async update(id: number, day: ScheduleDay, startTime: Date, endTime: Date) {
        await this.db
            .update(schedules)
            .set({ day, startTime, endTime })
            .where(eq(schedules.id, id));
    }

    async delete(id: number) {
        await this.db.delete(schedules).where(eq(schedules.id, id));
    }

    async hasConflict(
        classSubjectId: number,
        day: ScheduleDay,
        startTime: Date,
        endTime: Date,
        excludeScheduleId?: number,
    ): Promise<boolean> {
        const classSubject = await this.db
            .select({
                classId: classSubjects.classId,
                teacherId: classSubjects.teacherId,
            })
            .from(classSubjects)
            .where(eq(classSubjects.id, classSubjectId))
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!classSubject) {
            return false;
        }

        const whereConditions = [
            // Time overlaps when the schedule starts before the proposed schedule ends AND ends after the proposed schedule starts in the same day.
            and(
                eq(schedules.day, day),
                lt(schedules.startTime, endTime),
                gt(schedules.endTime, startTime),
            ),
            // Conflict happens if there is an overlap in the same class OR with the same teacher.
            classSubject.teacherId !== null
                ? or(
                      eq(classSubjects.classId, classSubject.classId),
                      eq(classSubjects.teacherId, classSubject.teacherId),
                  )
                : eq(classSubjects.classId, classSubject.classId),
        ];

        // If we are updating an existing schedule, we do not want it to trigger a conflict with itself.
        if (excludeScheduleId !== undefined) {
            whereConditions.push(ne(schedules.id, excludeScheduleId));
        }

        return this.db
            .select({ id: schedules.id })
            .from(schedules)
            .innerJoin(
                classSubjects,
                eq(schedules.classSubjectId, classSubjects.id),
            )
            .where(and(...whereConditions))
            .limit(1)
            .then((res) => res.length > 0);
    }

    private mapToDTO(schedules: ScheduleQueryResult[]): ScheduleDTO[] {
        return schedules.map((s) => ({
            id: s.id,
            classSubjectId: s.classSubjectId,
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
