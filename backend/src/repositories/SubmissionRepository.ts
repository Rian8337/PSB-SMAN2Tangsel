import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    assignmentSubmissions,
    students,
    users,
} from "@psb/shared/schema";
import { AssignmentSubmissionRow, DrizzleDb } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { ISubmissionRepository } from "./ISubmissionRepository";

/**
 * Defines operations for accessing assignment submission data in the database.
 */
@Injectable(dependencyTokens.submissionRepository)
export class SubmissionRepository
    extends DatabaseRepository
    implements ISubmissionRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async getForAssignment(assignmentId: number): Promise<AssignmentSubmissionRow[]> {
        const rows = await this.db
            .select({
                studentId: users.id,
                studentIdentifier: users.identifier,
                studentName: users.name,
                submittedAt: assignmentSubmissions.createdAt,
            })
            .from(assignmentSubmissions)
            .innerJoin(students, eq(assignmentSubmissions.studentId, students.userId))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(assignmentSubmissions.assignmentId, assignmentId));

        return rows.map((row) => ({
            studentId: row.studentId,
            studentIdentifier: row.studentIdentifier,
            studentName: row.studentName,
            submittedAt: row.submittedAt.toISOString(),
        }));
    }
}
