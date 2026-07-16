import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAnalyticsRepository } from "@/repositories";
import {
    DownloadAnalytics,
    StudentSubmissionConcern,
    SubmissionAnalytics,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IAnalyticsService } from "./IAnalyticsService";

@Injectable(dependencyTokens.analyticsService)
export class AnalyticsService implements IAnalyticsService {
    constructor(
        @inject(dependencyTokens.analyticsRepository)
        private readonly analyticsRepository: IAnalyticsRepository,
    ) {}

    async getDownloadAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        topLimit: number,
    ): Promise<DownloadAnalytics> {
        const [timeSeries, topAttachments] = await Promise.all([
            this.analyticsRepository.getDownloadTimeSeries(
                teacherId,
                session,
                semester,
            ),
            this.analyticsRepository.getTopDownloadedAttachments(
                teacherId,
                session,
                semester,
                topLimit,
            ),
        ]);

        return { timeSeries, topAttachments };
    }

    async getSubmissionAnalytics(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        concernLimit: number,
    ): Promise<SubmissionAnalytics> {
        const { assignments, roster, submissions } =
            await this.analyticsRepository.getSubmissionAnalyticsRawData(
                teacherId,
                session,
                semester,
            );

        if (assignments.length === 0) {
            return {
                summary: { onTime: 0, late: 0, missing: 0, pending: 0 },
                concerningStudents: [],
            };
        }

        const now = new Date();

        const submissionMap = new Map<string, Date>(
            submissions.map((r) => [
                `${String(r.assignmentId)}:${String(r.studentId)}`,
                r.submittedAt,
            ]),
        );

        const rosterByClass = new Map<number, typeof roster>();

        for (const row of roster) {
            const list = rosterByClass.get(row.classId) ?? [];

            list.push(row);
            rosterByClass.set(row.classId, list);
        }

        const summary: {
            onTime: number;
            late: number;
            missing: number;
            pending: number;
        } = {
            onTime: 0,
            late: 0,
            missing: 0,
            pending: 0,
        };

        // This is keyed by `${studentId}:${classSubjectId}`. A concern is scoped per class-subject,
        // not summed across a teacher's whole roster (see plan Context for rationale).
        const concernMap = new Map<
            string,
            Omit<StudentSubmissionConcern, "lateCount" | "missingCount"> & {
                lateCount: number;
                missingCount: number;
            }
        >();

        for (const assignment of assignments) {
            const classRoster = rosterByClass.get(assignment.classId) ?? [];

            for (const student of classRoster) {
                const submittedAt = submissionMap.get(
                    `${String(assignment.assignmentId)}:${String(student.studentId)}`,
                );

                const status = submittedAt
                    ? !assignment.dueAt || submittedAt <= assignment.dueAt
                        ? "onTime"
                        : "late"
                    : assignment.dueAt && assignment.dueAt <= now
                      ? "missing"
                      : "pending";

                summary[status]++;

                if (status === "late" || status === "missing") {
                    const key = `${String(student.studentId)}:${String(assignment.classSubjectId)}`;
                    const existing = concernMap.get(key) ?? {
                        studentId: student.studentId,
                        studentIdentifier: student.studentIdentifier,
                        studentName: student.studentName,
                        classSubjectId: assignment.classSubjectId,
                        subject: assignment.subject,
                        class: assignment.class,
                        lateCount: 0,
                        missingCount: 0,
                    };

                    existing[
                        status === "late" ? "lateCount" : "missingCount"
                    ]++;

                    concernMap.set(key, existing);
                }
            }
        }

        const concerningStudents = [...concernMap.values()]
            .sort(
                (a, b) =>
                    b.lateCount +
                    b.missingCount -
                    (a.lateCount + a.missingCount),
            )
            .slice(0, concernLimit);

        return { summary, concerningStudents };
    }
}
