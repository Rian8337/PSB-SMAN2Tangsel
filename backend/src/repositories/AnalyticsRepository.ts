import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    assignmentAttachments,
    assignments,
    attachmentDownloads,
    attachments,
    classes,
    classSubjects,
    materialAttachments,
    materials,
    subjects,
} from "@psb/shared/schema";
import {
    DownloadTimeSeriesPoint,
    DrizzleDb,
    TopDownloadedAttachment,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, count, eq, sql } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAnalyticsRepository } from "./IAnalyticsRepository";

/**
 * The SQL expression for the Monday date that starts the week containing
 * `attachmentDownloads.downloadedAt`.
 */
const weekStartExpr = sql<string>`DATE_SUB(DATE(${attachmentDownloads.downloadedAt}), INTERVAL WEEKDAY(${attachmentDownloads.downloadedAt}) DAY)`;

/**
 * Defines operations for aggregating download analytics data for a teacher.
 *
 * An attachment belongs to either a material or an assignment (never both, via the separate
 * {@link materialAttachments}/{@link assignmentAttachments} join tables), so each method here runs a
 * material-side query and an assignment-side query, then merges the results in TypeScript rather
 * than via a SQL `UNION` — the true per-week totals and top-N ranking can only be determined after
 * combining both sources.
 */
@Injectable(dependencyTokens.analyticsRepository)
export class AnalyticsRepository
    extends DatabaseRepository
    implements IAnalyticsRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async getDownloadTimeSeries(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<DownloadTimeSeriesPoint[]> {
        const materialRows = await this.db
            .select({ weekStart: weekStartExpr, count: count() })
            .from(attachmentDownloads)
            .innerJoin(
                attachments,
                eq(attachmentDownloads.attachmentId, attachments.id),
            )
            .innerJoin(
                materialAttachments,
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
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .where(
                and(
                    eq(classSubjects.teacherId, teacherId),
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                ),
            )
            .groupBy(weekStartExpr);

        const assignmentRows = await this.db
            .select({ weekStart: weekStartExpr, count: count() })
            .from(attachmentDownloads)
            .innerJoin(
                attachments,
                eq(attachmentDownloads.attachmentId, attachments.id),
            )
            .innerJoin(
                assignmentAttachments,
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
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .where(
                and(
                    eq(classSubjects.teacherId, teacherId),
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                ),
            )
            .groupBy(weekStartExpr);

        // Merge both sources by week, summing counts for weeks that appear in both.
        const merged = new Map<string, number>();

        for (const row of [...materialRows, ...assignmentRows]) {
            merged.set(
                row.weekStart,
                (merged.get(row.weekStart) ?? 0) + row.count,
            );
        }

        return [...merged.entries()]
            .map(([weekStart, count]) => ({ weekStart, count }))
            .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    }

    async getTopDownloadedAttachments(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
    ): Promise<TopDownloadedAttachment[]> {
        const materialRows = await this.db
            .select({
                attachmentId: attachments.id,
                name: attachments.name,
                downloadCount: count(attachmentDownloads.id),
                contentId: materials.id,
                contentTitle: materials.title,
                classSubjectId: classSubjects.id,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
                class: { id: classes.id, name: classes.name },
            })
            .from(attachmentDownloads)
            .innerJoin(
                attachments,
                eq(attachmentDownloads.attachmentId, attachments.id),
            )
            .innerJoin(
                materialAttachments,
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
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(
                and(
                    eq(classSubjects.teacherId, teacherId),
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                ),
            )
            .groupBy(
                attachments.id,
                materials.id,
                classSubjects.id,
                subjects.id,
                classes.id,
            );

        // Mirror for assignments (same shape, joined via assignmentAttachments/assignments instead).
        const assignmentRows = await this.db
            .select({
                attachmentId: attachments.id,
                name: attachments.name,
                downloadCount: count(attachmentDownloads.id),
                contentId: assignments.id,
                contentTitle: assignments.title,
                classSubjectId: classSubjects.id,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
                class: { id: classes.id, name: classes.name },
            })
            .from(attachmentDownloads)
            .innerJoin(
                attachments,
                eq(attachmentDownloads.attachmentId, attachments.id),
            )
            .innerJoin(
                assignmentAttachments,
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
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .where(
                and(
                    eq(classSubjects.teacherId, teacherId),
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                ),
            )
            .groupBy(
                attachments.id,
                assignments.id,
                classSubjects.id,
                subjects.id,
                classes.id,
            );

        return [
            ...materialRows.map((r) => ({ ...r, type: "material" as const })),
            ...assignmentRows.map((r) => ({
                ...r,
                type: "assignment" as const,
            })),
        ]
            .sort((a, b) => b.downloadCount - a.downloadCount)
            .slice(0, limit);
    }
}
