import {
    AnalyticsAssignmentRow,
    ClassRosterRow,
} from "@/repositories/IAnalyticsRepository";
import { AnalyticsService } from "@/services/AnalyticsService";
import {
    DownloadTimeSeriesPoint,
    SubmissionAnalytics,
    TopDownloadedAttachment,
} from "@psb/shared/types";
import { mockAnalyticsRepository } from "@test/mocks";

describe("AnalyticsService (unit)", () => {
    const service = new AnalyticsService(mockAnalyticsRepository);

    describe("getDownloadAnalytics", () => {
        it("should call both repository methods with the correct arguments", async () => {
            const teacherId = 1;
            const session = "2024/2025";
            const semester = 1;
            const topLimit = 10;

            const timeSeries: DownloadTimeSeriesPoint[] = [
                { weekStart: "2024-01-01", count: 5 },
                { weekStart: "2024-01-08", count: 3 },
            ];

            const topAttachments: TopDownloadedAttachment[] = [
                {
                    attachmentId: 1,
                    name: "File 1",
                    downloadCount: 10,
                    type: "material",
                    contentId: 1,
                    contentTitle: "Material 1",
                    classSubjectId: 1,
                    subject: { id: 1, code: "MA1", name: "Matematika" },
                    class: { id: 1, name: "X-IPA-1" },
                },
            ];

            mockAnalyticsRepository.getDownloadTimeSeries.mockResolvedValue(
                timeSeries,
            );
            mockAnalyticsRepository.getTopDownloadedAttachments.mockResolvedValue(
                topAttachments,
            );

            const result = await service.getDownloadAnalytics(
                teacherId,
                session,
                semester,
                topLimit,
            );

            expect(
                mockAnalyticsRepository.getDownloadTimeSeries,
            ).toHaveBeenCalledWith(teacherId, session, semester);

            expect(
                mockAnalyticsRepository.getTopDownloadedAttachments,
            ).toHaveBeenCalledWith(teacherId, session, semester, topLimit);

            expect(result).toEqual({ timeSeries, topAttachments });
        });

        it("should pass topLimit through correctly to getTopDownloadedAttachments", async () => {
            const teacherId = 5;
            const session = "2023/2024";
            const semester = 2;
            const topLimit = 20;

            mockAnalyticsRepository.getDownloadTimeSeries.mockResolvedValue([]);
            mockAnalyticsRepository.getTopDownloadedAttachments.mockResolvedValue(
                [],
            );

            await service.getDownloadAnalytics(
                teacherId,
                session,
                semester,
                topLimit,
            );

            expect(
                mockAnalyticsRepository.getTopDownloadedAttachments,
            ).toHaveBeenCalledWith(teacherId, session, semester, topLimit);
        });

        it("should combine results into { timeSeries, topAttachments }", async () => {
            const timeSeries: DownloadTimeSeriesPoint[] = [
                { weekStart: "2024-02-01", count: 7 },
            ];

            const topAttachments: TopDownloadedAttachment[] = [
                {
                    attachmentId: 2,
                    name: "Document",
                    downloadCount: 15,
                    type: "assignment",
                    contentId: 2,
                    contentTitle: "Assignment 1",
                    classSubjectId: 2,
                    subject: { id: 2, code: "ENG", name: "English" },
                    class: { id: 2, name: "X-IPS-1" },
                },
                {
                    attachmentId: 3,
                    name: "Presentation",
                    downloadCount: 12,
                    type: "material",
                    contentId: 3,
                    contentTitle: "Material 2",
                    classSubjectId: 3,
                    subject: { id: 3, code: "BIO", name: "Biology" },
                    class: { id: 3, name: "XI-IPA-1" },
                },
            ];

            mockAnalyticsRepository.getDownloadTimeSeries.mockResolvedValue(
                timeSeries,
            );
            mockAnalyticsRepository.getTopDownloadedAttachments.mockResolvedValue(
                topAttachments,
            );

            const result = await service.getDownloadAnalytics(
                1,
                "2024/2025",
                1,
                15,
            );

            expect(result).toEqual({ timeSeries, topAttachments });
        });
    });

    describe("getSubmissionAnalytics", () => {
        // Classifying a submission's status (on-time/late/missing/pending) and aggregating
        // concerning students is business logic that lives here, not in the repository — these
        // tests exercise that logic directly against plain mocked raw data, no database required.
        // (The repository's own tests only verify that its queries fetch the right raw rows.)

        const teacherId = 2;
        const session = "2024/2025";
        const semester = 1;

        function makeAssignment(
            overrides: Partial<AnalyticsAssignmentRow> = {},
        ): AnalyticsAssignmentRow {
            return {
                assignmentId: 1,
                dueAt: null,
                classId: 1,
                classSubjectId: 1,
                subject: { id: 1, code: "MA1", name: "Matematika" },
                class: { id: 1, name: "X-IPA-1" },
                ...overrides,
            };
        }

        function makeStudent(
            overrides: Partial<ClassRosterRow> = {},
        ): ClassRosterRow {
            return {
                classId: 1,
                studentId: 101,
                studentIdentifier: "001",
                studentName: "Student One",
                ...overrides,
            };
        }

        it("calls the repository with the correct arguments", async () => {
            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                { assignments: [], roster: [], submissions: [] },
            );

            await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(
                mockAnalyticsRepository.getSubmissionAnalyticsRawData,
            ).toHaveBeenCalledWith(teacherId, session, semester);
        });

        it("returns a zeroed summary and no concerns when there are no assignments in scope", async () => {
            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                { assignments: [], roster: [], submissions: [] },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result).toEqual<SubmissionAnalytics>({
                summary: { onTime: 0, late: 0, missing: 0, pending: 0 },
                concerningStudents: [],
            });
        });

        it("classifies a submission on or before the deadline as on-time", async () => {
            const dueAt = new Date("2024-03-15T00:00:00.000Z");
            const submittedAt = new Date("2024-03-14T00:00:00.000Z");

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt })],
                    roster: [makeStudent()],
                    submissions: [
                        { assignmentId: 1, studentId: 101, submittedAt },
                    ],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 1,
                late: 0,
                missing: 0,
                pending: 0,
            });
            expect(result.concerningStudents).toEqual([]);
        });

        it("classifies a submission with no deadline as on-time, never late", async () => {
            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt: null })],
                    roster: [makeStudent()],
                    submissions: [
                        {
                            assignmentId: 1,
                            studentId: 101,
                            submittedAt: new Date(),
                        },
                    ],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 1,
                late: 0,
                missing: 0,
                pending: 0,
            });
        });

        it("classifies a submission after the deadline as late", async () => {
            const dueAt = new Date("2024-03-15T00:00:00.000Z");
            const submittedAt = new Date("2024-03-16T00:00:00.000Z");

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt })],
                    roster: [makeStudent()],
                    submissions: [
                        { assignmentId: 1, studentId: 101, submittedAt },
                    ],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 0,
                late: 1,
                missing: 0,
                pending: 0,
            });
            expect(result.concerningStudents).toEqual([
                expect.objectContaining({
                    studentId: 101,
                    lateCount: 1,
                    missingCount: 0,
                }),
            ]);
        });

        it("classifies a missing (unsubmitted, past due) submission as missing", async () => {
            const dueAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt })],
                    roster: [makeStudent()],
                    submissions: [],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 0,
                late: 0,
                missing: 1,
                pending: 0,
            });
            expect(result.concerningStudents).toEqual([
                expect.objectContaining({
                    studentId: 101,
                    lateCount: 0,
                    missingCount: 1,
                }),
            ]);
        });

        it("classifies an unsubmitted assignment with a future deadline as pending, not missing", async () => {
            const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt })],
                    roster: [makeStudent()],
                    submissions: [],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 0,
                late: 0,
                missing: 0,
                pending: 1,
            });
            expect(result.concerningStudents).toEqual([]);
        });

        it("classifies an unsubmitted assignment with no deadline as pending, never missing", async () => {
            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [makeAssignment({ dueAt: null })],
                    roster: [makeStudent()],
                    submissions: [],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.summary).toEqual({
                onTime: 0,
                late: 0,
                missing: 0,
                pending: 1,
            });
            expect(result.concerningStudents).toEqual([]);
        });

        it("aggregates a student's late/missing counts per class-subject, not across the teacher's whole roster", async () => {
            const dueAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [
                        makeAssignment({
                            assignmentId: 1,
                            classId: 1,
                            classSubjectId: 1,
                            dueAt,
                        }),
                        makeAssignment({
                            assignmentId: 2,
                            classId: 2,
                            classSubjectId: 2,
                            dueAt,
                            class: { id: 2, name: "X-IPA-2" },
                        }),
                    ],
                    roster: [
                        makeStudent({ classId: 1 }),
                        makeStudent({ classId: 2 }),
                    ],
                    submissions: [
                        // On time in class-subject 2; missing (no submission) in class-subject 1.
                        {
                            assignmentId: 2,
                            studentId: 101,
                            submittedAt: new Date(dueAt.getTime() - 1000),
                        },
                    ],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.concerningStudents).toEqual([
                expect.objectContaining({
                    studentId: 101,
                    classSubjectId: 1,
                    lateCount: 0,
                    missingCount: 1,
                }),
            ]);
            // No phantom entry for class-subject 2, where the student was on time.
            expect(
                result.concerningStudents.some((c) => c.classSubjectId === 2),
            ).toBe(false);
        });

        it("sorts concerning students by severity (late + missing) descending and respects concernLimit", async () => {
            const dueAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

            mockAnalyticsRepository.getSubmissionAnalyticsRawData.mockResolvedValue(
                {
                    assignments: [
                        makeAssignment({ assignmentId: 1, dueAt }),
                        makeAssignment({ assignmentId: 2, dueAt }),
                    ],
                    roster: [
                        makeStudent({
                            studentId: 101,
                            studentName: "One Miss",
                        }),
                        makeStudent({
                            studentId: 102,
                            studentName: "Two Misses",
                        }),
                    ],
                    submissions: [
                        // Student 101 submits assignment 1 on time, misses assignment 2 -> 1 miss.
                        {
                            assignmentId: 1,
                            studentId: 101,
                            submittedAt: new Date(dueAt.getTime() - 1000),
                        },
                        // Student 102 submits nothing -> 2 misses.
                    ],
                },
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                5,
            );

            expect(result.concerningStudents.map((c) => c.studentId)).toEqual(
                [102, 101],
            );

            const limited = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                1,
            );

            expect(limited.concerningStudents).toHaveLength(1);
            expect(limited.concerningStudents[0].studentId).toBe(102);
        });
    });
});
