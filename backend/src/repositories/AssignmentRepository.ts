import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    assignmentAttachments,
    assignments,
    assignmentSubmissionAttachments,
    assignmentSubmissions,
    attachments,
    classSubjects,
    studentClasses,
    subjects,
} from "@psb/shared/schema";
import {
    DrizzleDb,
    StudentSubjectAssignment,
    SubjectAssignmentAttachment,
    SubjectAssignmentSubmission,
    Subject,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import { and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAssignmentRepository } from "./IAssignmentRepository";

/**
 * Defines operations for accessing assignment data in the database.
 */
@Injectable(dependencyTokens.assignmentRepository)
export class AssignmentRepository
    extends DatabaseRepository
    implements IAssignmentRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async getStudentAssignment(
        assignmentId: number,
        studentId: number,
    ): Promise<StudentSubjectAssignment | null> {
        const row = await this.db
            .select({
                id: assignments.id,
                classSubjectId: assignments.classSubjectId,
                title: assignments.title,
                description: assignments.description,
                dueAt: assignments.dueAt,
                createdAt: assignments.createdAt,
                lastUpdatedAt: assignments.lastUpdatedAt,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
            })
            .from(assignments)
            .innerJoin(
                classSubjects,
                eq(assignments.classSubjectId, classSubjects.id),
            )
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .innerJoin(
                studentClasses,
                and(
                    eq(studentClasses.classId, classSubjects.classId),
                    eq(studentClasses.studentId, studentId),
                ),
            )
            .where(
                and(
                    eq(assignments.id, assignmentId),
                    eq(assignments.visible, true),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);

        return row ? this.assembleStudentAssignment(row, studentId) : null;
    }

    async getTeacherAssignment(
        assignmentId: number,
        teacherId: number,
    ): Promise<TeacherSubjectAssignment | null> {
        const row = await this.db
            .select({
                id: assignments.id,
                classSubjectId: assignments.classSubjectId,
                title: assignments.title,
                description: assignments.description,
                dueAt: assignments.dueAt,
                visible: assignments.visible,
                createdAt: assignments.createdAt,
                lastUpdatedAt: assignments.lastUpdatedAt,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
            })
            .from(assignments)
            .innerJoin(
                classSubjects,
                and(
                    eq(assignments.classSubjectId, classSubjects.id),
                    eq(classSubjects.teacherId, teacherId),
                ),
            )
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(eq(assignments.id, assignmentId))
            .limit(1)
            .then((res) => res.at(0) ?? null);

        return row ? this.assembleTeacherAssignment(row) : null;
    }

    async getStudentAttachment(
        assignmentId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string } | null> {
        return this.db
            .select({ path: attachments.path, name: attachments.name })
            .from(assignmentAttachments)
            .innerJoin(
                attachments,
                eq(assignmentAttachments.attachmentId, attachments.id),
            )
            .innerJoin(
                assignments,
                eq(assignmentAttachments.assignmentId, assignments.id),
            )
            .innerJoin(
                classSubjects,
                eq(assignments.classSubjectId, classSubjects.id),
            )
            .innerJoin(
                studentClasses,
                and(
                    eq(studentClasses.classId, classSubjects.classId),
                    eq(studentClasses.studentId, studentId),
                ),
            )
            .where(
                and(
                    eq(assignmentAttachments.assignmentId, assignmentId),
                    eq(assignmentAttachments.attachmentId, attachmentId),
                    eq(assignments.visible, true),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    async getTeacherAttachment(
        assignmentId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string } | null> {
        return this.db
            .select({ path: attachments.path, name: attachments.name })
            .from(assignmentAttachments)
            .innerJoin(
                attachments,
                eq(assignmentAttachments.attachmentId, attachments.id),
            )
            .innerJoin(
                assignments,
                eq(assignmentAttachments.assignmentId, assignments.id),
            )
            .innerJoin(
                classSubjects,
                and(
                    eq(assignments.classSubjectId, classSubjects.id),
                    eq(classSubjects.teacherId, teacherId),
                ),
            )
            .where(
                and(
                    eq(assignmentAttachments.assignmentId, assignmentId),
                    eq(assignmentAttachments.attachmentId, attachmentId),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    private async assembleStudentAssignment(
        row: {
            id: number;
            classSubjectId: number;
            title: string;
            description: string | null;
            dueAt: Date | null;
            createdAt: Date;
            lastUpdatedAt: Date;
            subject: Pick<Subject, "id" | "code" | "name">;
        },
        studentId: number,
    ): Promise<StudentSubjectAssignment> {
        const assignmentAttachmentRows = await this.db
            .select({ id: attachments.id, name: attachments.name })
            .from(assignmentAttachments)
            .innerJoin(
                attachments,
                eq(assignmentAttachments.attachmentId, attachments.id),
            )
            .where(eq(assignmentAttachments.assignmentId, row.id));

        const submission = await this.fetchStudentSubmission(row.id, studentId);

        return {
            id: row.id,
            classSubjectId: row.classSubjectId,
            subject: row.subject,
            title: row.title,
            description: row.description,
            dueAt: row.dueAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
            lastUpdatedAt: row.lastUpdatedAt.toISOString(),
            attachments: assignmentAttachmentRows,
            submission,
        };
    }

    private async assembleTeacherAssignment(row: {
        id: number;
        classSubjectId: number;
        title: string;
        description: string | null;
        dueAt: Date | null;
        visible: boolean;
        createdAt: Date;
        lastUpdatedAt: Date;
        subject: Pick<Subject, "id" | "code" | "name">;
    }): Promise<TeacherSubjectAssignment> {
        const assignmentAttachmentRows: SubjectAssignmentAttachment[] =
            await this.db
                .select({ id: attachments.id, name: attachments.name })
                .from(assignmentAttachments)
                .innerJoin(
                    attachments,
                    eq(assignmentAttachments.attachmentId, attachments.id),
                )
                .where(eq(assignmentAttachments.assignmentId, row.id));

        return {
            id: row.id,
            classSubjectId: row.classSubjectId,
            subject: row.subject,
            title: row.title,
            description: row.description,
            dueAt: row.dueAt?.toISOString() ?? null,
            visible: row.visible,
            createdAt: row.createdAt.toISOString(),
            lastUpdatedAt: row.lastUpdatedAt.toISOString(),
            attachments: assignmentAttachmentRows,
        };
    }

    private async fetchStudentSubmission(
        assignmentId: number,
        studentId: number,
    ): Promise<SubjectAssignmentSubmission | null> {
        const submissionRow = await this.db
            .select({
                id: assignmentSubmissions.id,
                submittedAt: assignmentSubmissions.createdAt,
            })
            .from(assignmentSubmissions)
            .where(
                and(
                    eq(assignmentSubmissions.assignmentId, assignmentId),
                    eq(assignmentSubmissions.studentId, studentId),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!submissionRow) {
            return null;
        }

        const submissionAttachmentRows = await this.db
            .select({ id: attachments.id, name: attachments.name })
            .from(assignmentSubmissionAttachments)
            .innerJoin(
                attachments,
                eq(
                    assignmentSubmissionAttachments.attachmentId,
                    attachments.id,
                ),
            )
            .where(
                eq(
                    assignmentSubmissionAttachments.submissionId,
                    submissionRow.id,
                ),
            );

        return {
            id: submissionRow.id,
            submittedAt: submissionRow.submittedAt.toISOString(),
            attachments: submissionAttachmentRows,
        };
    }
}
