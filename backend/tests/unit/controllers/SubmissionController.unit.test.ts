import { SubmissionController } from "@/controllers/SubmissionController";
import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
    UserRole,
} from "@psb/shared/types";
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
                        role: UserRole.Teacher,
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
                        role: UserRole.Teacher,
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
                    role: UserRole.Teacher,
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
                    role: UserRole.Teacher,
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
                        role: UserRole.Teacher,
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
                    role: UserRole.Teacher,
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

    describe("createSubmission", () => {
        const createSubmissionMockRequest = createMockRequestFactory<
            { assignmentId: string },
            SubjectAssignmentSubmission,
            Record<string, unknown>
        >();

        const mockCreatedSubmission: SubjectAssignmentSubmission = {
            id: 5,
            submittedAt: "2026-02-18T12:57:32.000Z",
            attachments: [{ id: 10, name: "report.pdf" }],
        };

        it("should return 401 if no session is present", async () => {
            const req = createSubmissionMockRequest({
                params: { assignmentId: "1" },
                body: {},
            });

            await controller.createSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockSubmissionService.addSubmission).not.toHaveBeenCalled();
        });

        it.each([
            { assignmentId: "abc" },
            { assignmentId: "0" },
            { assignmentId: "-1" },
        ])(
            "should return 400 for an invalid assignment ID: $assignmentId",
            async ({ assignmentId }) => {
                const req = createSubmissionMockRequest({
                    params: { assignmentId },
                    body: {},
                    sessionData: {
                        userId: 3,
                        identifier: "3",
                        role: UserRole.Student,
                    },
                });

                await controller.createSubmission(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockSubmissionService.addSubmission,
                ).not.toHaveBeenCalled();
            },
        );

        it("should call addSubmission and return 201 with the created submission", async () => {
            mockSubmissionService.addSubmission.mockResolvedValue(
                mockCreatedSubmission,
            );

            const req = createSubmissionMockRequest({
                params: { assignmentId: "1" },
                body: {},
                sessionData: {
                    userId: 3,
                    identifier: "3",
                    role: UserRole.Student,
                },
            });

            await controller.createSubmission(req, res);

            expect(mockSubmissionService.addSubmission).toHaveBeenCalledWith(
                1,
                3,
                [],
            );

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedSubmission);
        });
    });

    describe("updateSubmission", () => {
        const createUpdateMockRequest = createMockRequestFactory<
            { assignmentId: string },
            unknown,
            Record<string, unknown>
        >();

        it("should return 401 if no session is present", async () => {
            const req = createUpdateMockRequest({
                params: { assignmentId: "1" },
                body: {},
            });

            await controller.updateSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(
                mockSubmissionService.updateSubmission,
            ).not.toHaveBeenCalled();
        });

        it.each([{ assignmentId: "abc" }, { assignmentId: "0" }])(
            "should return 400 for an invalid assignment ID: $assignmentId",
            async ({ assignmentId }) => {
                const req = createUpdateMockRequest({
                    params: { assignmentId },
                    body: {},
                    sessionData: {
                        userId: 3,
                        identifier: "3",
                        role: UserRole.Student,
                    },
                });

                await controller.updateSubmission(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockSubmissionService.updateSubmission,
                ).not.toHaveBeenCalled();
            },
        );

        it("should call updateSubmission and return 200 on success", async () => {
            mockSubmissionService.updateSubmission.mockResolvedValue(undefined);

            const req = createUpdateMockRequest({
                params: { assignmentId: "1" },
                body: {
                    deletedAttachmentIds: JSON.stringify([]),
                    renamedAttachments: JSON.stringify([]),
                },
                sessionData: {
                    userId: 3,
                    identifier: "3",
                    role: UserRole.Student,
                },
            });

            await controller.updateSubmission(req, res);

            expect(mockSubmissionService.updateSubmission).toHaveBeenCalledWith(
                1,
                3,
                [],
                [],
                [],
            );

            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });
    });

    describe("deleteSubmission", () => {
        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { assignmentId: "1" } });

            await controller.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(
                mockSubmissionService.deleteSubmission,
            ).not.toHaveBeenCalled();
        });

        it.each([{ assignmentId: "abc" }, { assignmentId: "0" }])(
            "should return 400 for an invalid assignment ID: $assignmentId",
            async ({ assignmentId }) => {
                const req = createMockRequest({
                    params: { assignmentId },
                    sessionData: {
                        userId: 3,
                        identifier: "3",
                        role: UserRole.Student,
                    },
                });

                await controller.deleteSubmission(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockSubmissionService.deleteSubmission,
                ).not.toHaveBeenCalled();
            },
        );

        it("should call deleteSubmission and return 204 on success", async () => {
            mockSubmissionService.deleteSubmission.mockResolvedValue(undefined);

            const req = createMockRequest({
                params: { assignmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "3",
                    role: UserRole.Student,
                },
            });

            await controller.deleteSubmission(req, res);

            expect(mockSubmissionService.deleteSubmission).toHaveBeenCalledWith(
                1,
                3,
            );

            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });
});
