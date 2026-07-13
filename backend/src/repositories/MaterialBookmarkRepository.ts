import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    classes,
    classSubjects,
    materialBookmarks,
    materials,
    subjects,
} from "@psb/shared/schema";
import { DrizzleDb, ValidSemester, ValidSession } from "@psb/shared/types";
import { and, desc, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import {
    BookmarkedMaterialRow,
    IMaterialBookmarkRepository,
} from "./IMaterialBookmarkRepository";

/**
 * Defines operations for accessing and managing material bookmark data in the database.
 */
@Injectable(dependencyTokens.materialBookmarkRepository)
export class MaterialBookmarkRepository
    extends DatabaseRepository
    implements IMaterialBookmarkRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async add(userId: number, materialId: number) {
        await this.db
            .insert(materialBookmarks)
            .values({ userId, materialId })
            .onDuplicateKeyUpdate({ set: { materialId } });
    }

    async remove(userId: number, materialId: number) {
        await this.db
            .delete(materialBookmarks)
            .where(
                and(
                    eq(materialBookmarks.userId, userId),
                    eq(materialBookmarks.materialId, materialId),
                ),
            );
    }

    findBookmarkedMaterialIds(
        userId: number,
        classSubjectId: number,
    ): Promise<number[]> {
        return this.db
            .select({ materialId: materialBookmarks.materialId })
            .from(materialBookmarks)
            .innerJoin(
                materials,
                eq(materialBookmarks.materialId, materials.id),
            )
            .where(
                and(
                    eq(materialBookmarks.userId, userId),
                    eq(materials.classSubjectId, classSubjectId),
                ),
            )
            .then((rows) => rows.map((row) => row.materialId));
    }

    findByUserForSession(
        userId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
        offset: number,
    ): Promise<BookmarkedMaterialRow[]> {
        return (
            this.db
                .select({
                    materialId: materialBookmarks.materialId,
                    classSubjectId: materials.classSubjectId,
                    title: materials.title,
                    bookmarkedAt: materialBookmarks.createdAt,
                    subject: {
                        id: subjects.id,
                        code: subjects.code,
                        name: subjects.name,
                    },
                    class: { id: classes.id, name: classes.name },
                })
                .from(materialBookmarks)
                .innerJoin(
                    materials,
                    eq(materialBookmarks.materialId, materials.id),
                )
                .innerJoin(
                    classSubjects,
                    eq(materials.classSubjectId, classSubjects.id),
                )
                .innerJoin(classes, eq(classSubjects.classId, classes.id))
                .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
                .where(
                    and(
                        eq(materialBookmarks.userId, userId),
                        eq(classes.session, session),
                        eq(classes.semester, semester),
                    ),
                )
                // materialId is a secondary sort key purely to make ordering deterministic when two
                // bookmarks tie on createdAt (e.g. created in rapid succession). It carries no meaning
                // about recency on its own.
                .orderBy(
                    desc(materialBookmarks.createdAt),
                    desc(materialBookmarks.materialId),
                )
                .limit(limit)
                .offset(offset)
        );
    }
}
