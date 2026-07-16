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
        it("should call repository.getSubmissionAnalytics with correct arguments and return result verbatim", async () => {
            const teacherId = 2;
            const session = "2024/2025";
            const semester = 1;
            const concernLimit = 5;

            const mockAnalytics: SubmissionAnalytics = {
                summary: {
                    onTime: 25,
                    late: 3,
                    missing: 2,
                    pending: 0,
                },
                concerningStudents: [
                    {
                        studentId: 101,
                        studentIdentifier: "001",
                        studentName: "John Doe",
                        lateCount: 2,
                        missingCount: 1,
                        classSubjectId: 1,
                        subject: { id: 1, code: "MA1", name: "Matematika" },
                        class: { id: 1, name: "X-IPA-1" },
                    },
                    {
                        studentId: 102,
                        studentIdentifier: "002",
                        studentName: "Jane Smith",
                        lateCount: 1,
                        missingCount: 0,
                        classSubjectId: 1,
                        subject: { id: 1, code: "MA1", name: "Matematika" },
                        class: { id: 1, name: "X-IPA-1" },
                    },
                ],
            };

            mockAnalyticsRepository.getSubmissionAnalytics.mockResolvedValue(
                mockAnalytics,
            );

            const result = await service.getSubmissionAnalytics(
                teacherId,
                session,
                semester,
                concernLimit,
            );

            expect(
                mockAnalyticsRepository.getSubmissionAnalytics,
            ).toHaveBeenCalledWith(teacherId, session, semester, concernLimit);

            expect(result).toEqual(mockAnalytics);
        });
    });
});
