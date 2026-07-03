import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { classes, classSubjects, studentClasses } from "@psb/shared/schema";
import {
    Class,
    DrizzleDb,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, eq, like } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IClassRepository } from "./IClassRepository";

/**
 * Defines operations for accessing and managing class data in the database.
 */
@Injectable(dependencyTokens.classRepository)
export class ClassRepository
    extends DatabaseRepository
    implements IClassRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }
    getById(id: number): Promise<Class | null> {
        return this.db
            .select()
            .from(classes)
            .where(eq(classes.id, id))
            .then((res) => res.at(0) ?? null);
    }

    getEnrolledStudentIds(classId: number): Promise<number[]> {
        return this.db
            .select({ id: studentClasses.studentId })
            .from(studentClasses)
            .where(eq(studentClasses.classId, classId))
            .then((res) => res.map((row) => row.id));
    }

    list(
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<Class[]> {
        return this.db
            .select()
            .from(classes)
            .where(
                and(
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                    query ? like(classes.name, `%${query}%`) : undefined,
                ),
            )
            .limit(limit)
            .offset(offset);
    }

    async create(name: string, session: ValidSession, semester: ValidSemester) {
        await this.db.insert(classes).values({
            name,
            session,
            semester,
        });
    }

    async update(id: number, name: string) {
        await this.db.update(classes).set({ name }).where(eq(classes.id, id));
    }

    hasStudents(id: number): Promise<boolean> {
        return this.db
            .select()
            .from(studentClasses)
            .where(eq(studentClasses.classId, id))
            .limit(1)
            .then((res) => res.length > 0);
    }

    hasSubjects(id: number): Promise<boolean> {
        return this.db
            .select()
            .from(classSubjects)
            .where(eq(classSubjects.classId, id))
            .limit(1)
            .then((res) => res.length > 0);
    }

    async delete(id: number) {
        await this.db.delete(classes).where(eq(classes.id, id));
    }
}
