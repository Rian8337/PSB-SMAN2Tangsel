import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    assignmentSubmissionAttachments,
    assignmentSubmissions,
    attachments,
    students,
    users,
} from "@psb/shared/schema";
import {
    AssignmentSubmissionRow,
    DrizzleDb,
    SubjectAssignmentSubmission,
} from "@psb/shared/types";
import { SQL, and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import {
    ISubmissionRepository,
    SubmissionDownloadRow,
} from "./ISubmissionRepository";

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

    async getForAssignment(
        assignmentId: number,
    ): Promise<AssignmentSubmissionRow[]> {
        const rows = await this.db
            .select({
                studentId: users.id,
                studentIdentifier: users.identifier,
                studentName: users.name,
                submittedAt: assignmentSubmissions.createdAt,
            })
            .from(assignmentSubmissions)
            .innerJoin(
                students,
                eq(assignmentSubmissions.studentId, students.userId),
            )
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(assignmentSubmissions.assignmentId, assignmentId));

        return rows.map((row) => ({
            studentId: row.studentId,
            studentIdentifier: row.studentIdentifier,
            studentName: row.studentName,
            submittedAt: row.submittedAt.toISOString(),
        }));
    }

    async getForAssignmentWithAttachments(
        assignmentId: number,
        studentId?: number,
    ): Promise<SubmissionDownloadRow[]> {
        const conditions: SQL[] = [
            eq(assignmentSubmissions.assignmentId, assignmentId),
        ];

        if (studentId !== undefined) {
            conditions.push(eq(students.userId, studentId));
        }

        return this.db
            .select({
                studentName: users.name,
                studentIdentifier: users.identifier,
                attachmentName: attachments.name,
                attachmentPath: attachments.path,
            })
            .from(assignmentSubmissions)
            .innerJoin(
                students,
                eq(assignmentSubmissions.studentId, students.userId),
            )
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(
                assignmentSubmissionAttachments,
                eq(
                    assignmentSubmissionAttachments.submissionId,
                    assignmentSubmissions.id,
                ),
            )
            .innerJoin(
                attachments,
                eq(
                    assignmentSubmissionAttachments.attachmentId,
                    attachments.id,
                ),
            )
            .where(and(...conditions));
    }

    async getByStudent(
        assignmentId: number,
        studentId: number,
    ): Promise<SubjectAssignmentSubmission | null> {
        const rows = await this.db
            .select({
                id: assignmentSubmissions.id,
                submittedAt: assignmentSubmissions.createdAt,
                attachmentId: assignmentSubmissionAttachments.attachmentId,
                attachmentName: attachments.name,
            })
            .from(assignmentSubmissions)
            .leftJoin(
                assignmentSubmissionAttachments,
                eq(
                    assignmentSubmissionAttachments.submissionId,
                    assignmentSubmissions.id,
                ),
            )
            .leftJoin(
                attachments,
                eq(
                    assignmentSubmissionAttachments.attachmentId,
                    attachments.id,
                ),
            )
            .where(
                and(
                    eq(assignmentSubmissions.assignmentId, assignmentId),
                    eq(assignmentSubmissions.studentId, studentId),
                ),
            );

        if (rows.length === 0) {
            return null;
        }

        const first = rows[0];

        return {
            id: first.id,
            submittedAt: first.submittedAt.toISOString(),
            attachments: rows
                .filter((r) => r.attachmentId !== null)
                .map((r) => ({
                    id: r.attachmentId!,
                    name: r.attachmentName!,
                })),
        };
    }

    async getAttachmentIds(submissionId: number): Promise<number[]> {
        const rows = await this.db
            .select({
                attachmentId: assignmentSubmissionAttachments.attachmentId,
            })
            .from(assignmentSubmissionAttachments)
            .where(
                eq(assignmentSubmissionAttachments.submissionId, submissionId),
            );

        return rows.map((r) => r.attachmentId);
    }

    async add(
        assignmentId: number,
        studentId: number,
        attachmentIds: number[],
    ): Promise<SubjectAssignmentSubmission> {
        let insertedId!: number;

        await this.db.transaction(async (tx) => {
            const [result] = await tx
                .insert(assignmentSubmissions)
                .values({ assignmentId, studentId });

            insertedId = result.insertId;

            if (attachmentIds.length > 0) {
                await tx.insert(assignmentSubmissionAttachments).values(
                    attachmentIds.map((attachmentId) => ({
                        submissionId: insertedId,
                        attachmentId,
                    })),
                );
            }
        });

        const submission = await this.getByStudent(assignmentId, studentId);

        // The submission was just inserted, so it must exist.
        return submission!;
    }

    async addAttachments(submissionId: number, attachmentIds: number[]) {
        if (attachmentIds.length === 0) {
            return;
        }

        await this.db.insert(assignmentSubmissionAttachments).values(
            attachmentIds.map((attachmentId) => ({
                submissionId,
                attachmentId,
            })),
        );
    }

    async delete(submissionId: number) {
        await this.db
            .delete(assignmentSubmissions)
            .where(eq(assignmentSubmissions.id, submissionId));
    }

    hasSubmissions(studentId: number): Promise<boolean> {
        return this.db
            .select()
            .from(assignmentSubmissions)
            .where(eq(assignmentSubmissions.studentId, studentId))
            .limit(1)
            .then((res) => res.length > 0);
    }
}
