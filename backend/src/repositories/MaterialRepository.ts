import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    attachments,
    classSubjects,
    materialAttachments,
    materials,
    studentClasses,
    subjects,
} from "@psb/shared/schema";
import { DrizzleDb, Subject, SubjectMaterial } from "@psb/shared/types";
import { and, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IMaterialRepository } from "./IMaterialRepository";

/**
 * Defines operations for accessing material data in the database.
 */
@Injectable(dependencyTokens.materialRepository)
export class MaterialRepository
    extends DatabaseRepository
    implements IMaterialRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async getStudentMaterial(
        materialId: number,
        studentId: number,
    ): Promise<SubjectMaterial | null> {
        const row = await this.db
            .select({
                id: materials.id,
                classSubjectId: materials.classSubjectId,
                title: materials.title,
                description: materials.description,
                visible: materials.visible,
                createdAt: materials.createdAt,
                lastUpdatedAt: materials.lastUpdatedAt,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
            })
            .from(materials)
            .innerJoin(
                classSubjects,
                eq(materials.classSubjectId, classSubjects.id),
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
                and(eq(materials.id, materialId), eq(materials.visible, true)),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!row) {
            return null;
        }

        return this.assembleMaterial(row);
    }

    async getTeacherMaterial(
        materialId: number,
        teacherId: number,
    ): Promise<SubjectMaterial | null> {
        const row = await this.db
            .select({
                id: materials.id,
                classSubjectId: materials.classSubjectId,
                title: materials.title,
                description: materials.description,
                visible: materials.visible,
                createdAt: materials.createdAt,
                lastUpdatedAt: materials.lastUpdatedAt,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
            })
            .from(materials)
            .innerJoin(
                classSubjects,
                and(
                    eq(materials.classSubjectId, classSubjects.id),
                    eq(classSubjects.teacherId, teacherId),
                ),
            )
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(eq(materials.id, materialId))
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!row) {
            return null;
        }

        return this.assembleMaterial(row);
    }

    async getStudentAttachment(
        materialId: number,
        attachmentId: number,
        studentId: number,
    ): Promise<{ path: string; name: string } | null> {
        return this.db
            .select({ path: attachments.path, name: attachments.name })
            .from(materialAttachments)
            .innerJoin(
                attachments,
                eq(materialAttachments.attachmentId, attachments.id),
            )
            .innerJoin(
                materials,
                eq(materialAttachments.materialId, materials.id),
            )
            .innerJoin(
                classSubjects,
                eq(materials.classSubjectId, classSubjects.id),
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
                    eq(materialAttachments.materialId, materialId),
                    eq(materialAttachments.attachmentId, attachmentId),
                    eq(materials.visible, true),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    async getTeacherAttachment(
        materialId: number,
        attachmentId: number,
        teacherId: number,
    ): Promise<{ path: string; name: string } | null> {
        return this.db
            .select({ path: attachments.path, name: attachments.name })
            .from(materialAttachments)
            .innerJoin(
                attachments,
                eq(materialAttachments.attachmentId, attachments.id),
            )
            .innerJoin(
                materials,
                eq(materialAttachments.materialId, materials.id),
            )
            .innerJoin(
                classSubjects,
                and(
                    eq(materials.classSubjectId, classSubjects.id),
                    eq(classSubjects.teacherId, teacherId),
                ),
            )
            .where(
                and(
                    eq(materialAttachments.materialId, materialId),
                    eq(materialAttachments.attachmentId, attachmentId),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    async addMaterial(
        classSubjectId: number,
        title: string,
        description: string | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<SubjectMaterial> {
        let insertedId: number;

        await this.db.transaction(async (tx) => {
            const [result] = await tx
                .insert(materials)
                .values({ classSubjectId, title, description, visible });

            insertedId = result.insertId;

            if (attachmentIds.length > 0) {
                await tx.insert(materialAttachments).values(
                    attachmentIds.map((attachmentId) => ({
                        materialId: insertedId,
                        attachmentId,
                    })),
                );
            }
        });

        return this.getMaterialById(insertedId!);
    }

    async updateMaterial(
        materialId: number,
        title: string,
        description: string | null,
        visible: boolean,
        attachmentIds: number[],
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            await tx
                .update(materials)
                .set({ title, description, visible, lastUpdatedAt: new Date() })
                .where(eq(materials.id, materialId));

            await tx
                .delete(materialAttachments)
                .where(eq(materialAttachments.materialId, materialId));

            if (attachmentIds.length > 0) {
                await tx.insert(materialAttachments).values(
                    attachmentIds.map((attachmentId) => ({
                        materialId,
                        attachmentId,
                    })),
                );
            }
        });
    }

    async deleteMaterial(materialId: number): Promise<void> {
        await this.db.delete(materials).where(eq(materials.id, materialId));
    }

    async getMaterialAttachmentIds(materialId: number): Promise<number[]> {
        const rows = await this.db
            .select({ attachmentId: materialAttachments.attachmentId })
            .from(materialAttachments)
            .where(eq(materialAttachments.materialId, materialId));

        return rows.map((r) => r.attachmentId);
    }

    private async getMaterialById(materialId: number): Promise<SubjectMaterial> {
        const row = await this.db
            .select({
                id: materials.id,
                classSubjectId: materials.classSubjectId,
                title: materials.title,
                description: materials.description,
                visible: materials.visible,
                createdAt: materials.createdAt,
                lastUpdatedAt: materials.lastUpdatedAt,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
            })
            .from(materials)
            .innerJoin(classSubjects, eq(materials.classSubjectId, classSubjects.id))
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(eq(materials.id, materialId))
            .limit(1)
            .then((res) => res.at(0));

        if (!row) {
            throw new Error(`Material ${materialId.toString()} not found after insert`);
        }

        return this.assembleMaterial(row);
    }

    private async assembleMaterial(row: {
        id: number;
        classSubjectId: number;
        title: string;
        description: string | null;
        visible: boolean;
        createdAt: Date;
        lastUpdatedAt: Date;
        subject: Pick<Subject, "id" | "code" | "name">;
    }): Promise<SubjectMaterial> {
        const attachmentRows = await this.db
            .select({ id: attachments.id, name: attachments.name })
            .from(materialAttachments)
            .innerJoin(
                attachments,
                eq(materialAttachments.attachmentId, attachments.id),
            )
            .where(eq(materialAttachments.materialId, row.id));

        return {
            id: row.id,
            classSubjectId: row.classSubjectId,
            subject: row.subject,
            title: row.title,
            description: row.description,
            visible: row.visible,
            createdAt: row.createdAt.toISOString(),
            lastUpdatedAt: row.lastUpdatedAt.toISOString(),
            attachments: attachmentRows,
        };
    }
}
