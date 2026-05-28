import { SubmissionController } from "@/controllers/SubmissionController";
import { AssignmentSubmissionRow, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockSubmissionService,
} from "@test/mocks";

describe("SubmissionController (unit)", () => {
    const controller = new SubmissionController(mockSubmissionService);

    let res: ReturnType<typeof createMockResponse>;

    const mockSubmissions: AssignmentSubmissionRow[] = [
        {
            studentId: 3,
            studentIdentifier: "0019217804",
            studentName: "Reza Mouna Hendrian",
            submittedAt: "2026-02-18T12:57:32.000Z",
        },
    ];

    const createMockRequest = createMockRequestFactory<{
        assignmentId: string;
    }>();

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("downloadSubmissions", () => {
        const mockZipBuffer = Buffer.from("zip content");

        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { assignmentId: "1" } });

            await controller.downloadSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(
                mockSubmissionService.downloadSubmissions,
            ).not.toHaveBeenCalled();
        });

        it.each([
            { assignmentId: "abc" },
            { assignmentId: "0" },
            { assignmentId: "-5" },
        ])(
            "should return 400 for an invalid assignment ID: $assignmentId",
            async ({ assignmentId }) => {
                const req = createMockRequest({
                    params: { assignmentId },
                    sessionData: {
                        userId: 2,
                        identifier: "2",
                        role: UserRole.teacher,
                    },
                });

                await controller.downloadSubmissions(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockSubmissionService.downloadSubmissions,
                ).not.toHaveBeenCalled();
            },
        );

        it.each([
            { studentId: "abc" },
            { studentId: "0" },
            { studentId: "-1" },
        ])(
            "should return 400 for an invalid studentId query param: $studentId",
            async ({ studentId }) => {
                const req = createMockRequest({
                    params: { assignmentId: "1" },
                    query: { studentId },
                    sessionData: {
                        userId: 2,
                        identifier: "2",
                        role: UserRole.teacher,
                    },
                });

                await controller.downloadSubmissions(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockSubmissionService.downloadSubmissions,
                ).not.toHaveBeenCalled();
            },
        );

        it("should call downloadSubmissions without studentId and send zip buffer with correct headers", async () => {
            mockSubmissionService.downloadSubmissions.mockResolvedValue(
                mockZipBuffer,
            );

            const req = createMockRequest({
                params: { assignmentId: "1" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.teacher,
                },
            });

            await controller.downloadSubmissions(req, res);

            expect(
                mockSubmissionService.downloadSubmissions,
            ).toHaveBeenCalledWith(1, 2, undefined);

            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Disposition",
                `attachment; filename="submissions-1.zip"`,
            );

            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Type",
                "application/zip",
            );

            expect(res.send).toHaveBeenCalledWith(mockZipBuffer);
        });

        it("should pass studentId to downloadSubmissions when the query param is provided", async () => {
            mockSubmissionService.downloadSubmissions.mockResolvedValue(
                mockZipBuffer,
            );

            const req = createMockRequest({
                params: { assignmentId: "1" },
                query: { studentId: "3" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.teacher,
                },
            });

            await controller.downloadSubmissions(req, res);

            expect(
                mockSubmissionService.downloadSubmissions,
            ).toHaveBeenCalledWith(1, 2, 3);
        });
    });

    describe("getSubmissions", () => {
        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { assignmentId: "1" } });

            await controller.getSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockSubmissionService.getSubmissions).not.toHaveBeenCalled();
        });

        it.each([
            { assignmentId: "abc" },
            { assignmentId: "0" },
            { assignmentId: "-5" },
        ])(
            "should return 400 for an invalid ID: $assignmentId",
            async ({ assignmentId }) => {
                const req = createMockRequest({
                    params: { assignmentId },
                    sessionData: {
                        userId: 2,
                        identifier: "2",
                        role: UserRole.teacher,
                    },
                });

                await controller.getSubmissions(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockSubmissionService.getSubmissions,
                ).not.toHaveBeenCalled();
            },
        );

        it("should call getSubmissions and return the result for a teacher session", async () => {
            mockSubmissionService.getSubmissions.mockResolvedValue(
                mockSubmissions,
            );

            const req = createMockRequest({
                params: { assignmentId: "1" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.teacher,
                },
            });

            await controller.getSubmissions(req, res);

            expect(mockSubmissionService.getSubmissions).toHaveBeenCalledWith(
                1,
                2,
            );

            expect(res.json).toHaveBeenCalledWith(mockSubmissions);
        });
    });
});
