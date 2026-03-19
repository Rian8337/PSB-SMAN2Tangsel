import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { studentClasses } from "@psb/shared/schema";
import { DrizzleDb } from "@psb/shared/types";
import { eq } from "drizzle-orm";
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

    getEnrolledStudentIds(classId: number): Promise<number[]> {
        return this.db
            .select({ id: studentClasses.studentId })
            .from(studentClasses)
            .where(eq(studentClasses.classId, classId))
            .then((res) => res.map((row) => row.id));
    }
}
