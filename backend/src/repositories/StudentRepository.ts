import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { classes, sessions, studentClasses } from "@psb/shared/schema";
import { DrizzleDb, ValidSemester, ValidSession } from "@psb/shared/types";
import { and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IStudentRepository } from "./IStudentRepository";

/**
 * Defines operations for accessing and managing student data in the database.
 */
@Injectable(dependencyTokens.studentRepository)
export class StudentRepository
    extends DatabaseRepository
    implements IStudentRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    getClassId(
        id: number,
        session?: ValidSession,
        semester?: ValidSemester,
    ): Promise<number | null> {
        const sessionConditions = [
            eq(sessions.session, session ?? classes.session),
            eq(sessions.semester, semester ?? classes.semester),
        ];

        if (!session || !semester) {
            sessionConditions.push(eq(sessions.active, true));
        }

        return this.db
            .select({ classId: classes.id })
            .from(studentClasses)
            .innerJoin(classes, eq(studentClasses.classId, classes.id))
            .innerJoin(sessions, and(...sessionConditions))
            .where(eq(studentClasses.studentId, id))
            .then((res) => res.at(0)?.classId ?? null);
    }
}
