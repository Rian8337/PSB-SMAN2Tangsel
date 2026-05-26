import { AssignmentController } from "@/controllers/AssignmentController";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockAssignmentService,
    mockConfigService,
} from "@test/mocks";
import { vi } from "vitest";

const fsMock = vi.hoisted(() => ({
    createReadStream: vi.fn(),
}));

vi.mock("fs", () => fsMock);

describe("AssignmentController (unit)", () => {
    const controller = new AssignmentController(
        mockAssignmentService,
        mockConfigService,
    );

    let res: ReturnType<typeof createMockResponse>;

    const mockStudentAssignment: StudentSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan Persamaan Linear Tiga Variabel",
        description: null,
        dueAt: "2026-02-21T18:00:00.000Z",
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "soal.pdf" }],
        submission: null,
    };

    const mockTeacherAssignment: TeacherSubjectAssignment = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Lanjut" },
        title: "Latihan Persamaan Linear Tiga Variabel",
        description: null,
        dueAt: "2026-02-21T18:00:00.000Z",
        visible: true,
        createdAt: "2026-01-15T00:00:00.000Z",
        lastUpdatedAt: "2026-01-23T00:00:00.000Z",
        attachments: [],
    };

    const createMockRequest = createMockRequestFactory<{ id: string }>();

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getAssignment", () => {
        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { id: "1" } });

            await controller.getAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(
                mockAssignmentService.getStudentAssignment,
            ).not.toHaveBeenCalled();
            expect(
                mockAssignmentService.getTeacherAssignment,
            ).not.toHaveBeenCalled();
        });

        it.each([{ id: "abc" }, { id: "0" }, { id: "-5" }])(
            "should return 400 for an invalid ID: $id",
            async ({ id }) => {
                const req = createMockRequest({
                    params: { id },
                    sessionData: {
                        userId: 3,
                        identifier: "0012345678",
                        role: UserRole.student,
                    },
                });

                await controller.getAssignment(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(
                    mockAssignmentService.getStudentAssignment,
                ).not.toHaveBeenCalled();
            },
        );

        it("should return 403 for an administrator session", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 1,
                    identifier: "1",
                    role: UserRole.administrator,
                },
            });

            await controller.getAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(
                mockAssignmentService.getStudentAssignment,
            ).not.toHaveBeenCalled();
            expect(
                mockAssignmentService.getTeacherAssignment,
            ).not.toHaveBeenCalled();
        });

        it("should call getStudentAssignment and return the assignment for a student session", async () => {
            mockAssignmentService.getStudentAssignment.mockResolvedValue(
                mockStudentAssignment,
            );

            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.student,
                },
            });

            await controller.getAssignment(req, res);

            expect(
                mockAssignmentService.getStudentAssignment,
            ).toHaveBeenCalledWith(1, 3);
            expect(res.json).toHaveBeenCalledWith(mockStudentAssignment);
        });

        it("should call getTeacherAssignment and return the assignment for a teacher session", async () => {
            mockAssignmentService.getTeacherAssignment.mockResolvedValue(
                mockTeacherAssignment,
            );

            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.teacher,
                },
            });

            await controller.getAssignment(req, res);

            expect(
                mockAssignmentService.getTeacherAssignment,
            ).toHaveBeenCalledWith(1, 2);
            expect(res.json).toHaveBeenCalledWith(mockTeacherAssignment);
        });
    });

    describe("downloadAttachment", () => {
        const createDownloadRequest = createMockRequestFactory<{
            assignmentId: string;
            attachmentId: string;
        }>();

        it("should return 401 if no session is present", async () => {
            const req = createDownloadRequest({
                params: { assignmentId: "1", attachmentId: "1" },
            });

            await controller.downloadAttachment(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it.each([
            { assignmentId: "abc", attachmentId: "1" },
            { assignmentId: "0", attachmentId: "1" },
            { assignmentId: "1", attachmentId: "abc" },
            { assignmentId: "1", attachmentId: "-1" },
        ])(
            "should return 400 for invalid IDs: assignmentId=$assignmentId, attachmentId=$attachmentId",
            async ({ assignmentId, attachmentId }) => {
                const req = createDownloadRequest({
                    params: { assignmentId, attachmentId },
                    sessionData: {
                        userId: 3,
                        identifier: "0012345678",
                        role: UserRole.student,
                    },
                });

                await controller.downloadAttachment(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it("should return 403 for an administrator session", async () => {
            const req = createDownloadRequest({
                params: { assignmentId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 1,
                    identifier: "1",
                    role: UserRole.administrator,
                },
            });

            await controller.downloadAttachment(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("should stream the file for a student session when the file exists", async () => {
            mockAssignmentService.getStudentAttachment.mockResolvedValue({
                path: "soal.pdf",
                name: "soal.pdf",
            });
            mockConfigService.getEnvironmentVariable.mockReturnValue(
                "/storage",
            );

            const mockPipe = vi.fn();

            fsMock.createReadStream.mockReturnValue({
                on: vi.fn(),
                pipe: mockPipe,
            });

            const req = createDownloadRequest({
                params: { assignmentId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.student,
                },
            });

            await controller.downloadAttachment(req, res);

            expect(
                mockAssignmentService.getStudentAttachment,
            ).toHaveBeenCalledWith(1, 1, 3);
            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Disposition",
                'attachment; filename="soal.pdf"',
            );
            expect(mockPipe).toHaveBeenCalledWith(res);
        });

        it("should return 404 when the file does not exist on disk", async () => {
            mockAssignmentService.getStudentAttachment.mockResolvedValue({
                path: "missing.pdf",
                name: "missing.pdf",
            });
            mockConfigService.getEnvironmentVariable.mockReturnValue(
                "/storage",
            );

            let errorHandler:
                | ((err: NodeJS.ErrnoException) => void)
                | undefined;

            fsMock.createReadStream.mockReturnValue({
                on: vi.fn(
                    (
                        event: string,
                        handler: (err: NodeJS.ErrnoException) => void,
                    ) => {
                        if (event === "error") {
                            errorHandler = handler;
                        }
                    },
                ),
                pipe: vi.fn(() => {
                    errorHandler?.(
                        Object.assign(new Error("ENOENT: no such file"), {
                            code: "ENOENT",
                        }),
                    );
                }),
            });

            const req = createDownloadRequest({
                params: { assignmentId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.student,
                },
            });

            await controller.downloadAttachment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
