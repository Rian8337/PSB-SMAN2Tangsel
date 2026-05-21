import { MaterialController } from "@/controllers/MaterialController";
import { SubjectMaterial, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockConfigService,
    mockMaterialService,
} from "@test/mocks";
import { vi } from "vitest";

const fsMock = vi.hoisted(() => ({
    createReadStream: vi.fn(),
}));

vi.mock("fs", () => fsMock);

describe("MaterialController (unit)", () => {
    const controller = new MaterialController(
        mockMaterialService,
        mockConfigService,
    );

    let res: ReturnType<typeof createMockResponse>;

    const mockMaterial: SubjectMaterial = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        title: "Chapter 1",
        description: "Introduction",
        visible: true,
        createdAt: "2024-01-15T00:00:00.000Z",
        lastUpdatedAt: "2024-01-23T00:00:00.000Z",
        attachments: [{ id: 1, name: "buku.pdf" }],
    };

    const createMockRequest = createMockRequestFactory<
        { id: string },
        SubjectMaterial
    >();

    beforeEach(() => {
        res = createMockResponse();
        vi.clearAllMocks();
    });

    describe("getMaterial", () => {
        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { id: "1" } });

            await controller.getMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);

            expect(
                mockMaterialService.getStudentMaterial,
            ).not.toHaveBeenCalled();

            expect(
                mockMaterialService.getTeacherMaterial,
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

                await controller.getMaterial(req, res);

                expect(res.status).toHaveBeenCalledWith(400);

                expect(
                    mockMaterialService.getStudentMaterial,
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

            await controller.getMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(403);

            expect(
                mockMaterialService.getStudentMaterial,
            ).not.toHaveBeenCalled();

            expect(
                mockMaterialService.getTeacherMaterial,
            ).not.toHaveBeenCalled();
        });

        it("should call getStudentMaterial and return the material for a student session", async () => {
            mockMaterialService.getStudentMaterial.mockResolvedValue(
                mockMaterial,
            );

            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.student,
                },
            });

            await controller.getMaterial(req, res);

            expect(mockMaterialService.getStudentMaterial).toHaveBeenCalledWith(
                1,
                3,
            );

            expect(res.json).toHaveBeenCalledWith(mockMaterial);
        });

        it("should call getTeacherMaterial and return the material for a teacher session", async () => {
            mockMaterialService.getTeacherMaterial.mockResolvedValue(
                mockMaterial,
            );

            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.teacher,
                },
            });

            await controller.getMaterial(req, res);

            expect(mockMaterialService.getTeacherMaterial).toHaveBeenCalledWith(
                1,
                2,
            );

            expect(res.json).toHaveBeenCalledWith(mockMaterial);
        });
    });

    describe("downloadAttachment", () => {
        const createDownloadRequest = createMockRequestFactory<{
            materialId: string;
            attachmentId: string;
        }>();

        it("should return 401 if no session is present", async () => {
            const req = createDownloadRequest({
                params: { materialId: "1", attachmentId: "1" },
            });

            await controller.downloadAttachment(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it.each([
            { materialId: "abc", attachmentId: "1" },
            { materialId: "0", attachmentId: "1" },
            { materialId: "1", attachmentId: "abc" },
            { materialId: "1", attachmentId: "-1" },
        ])(
            "should return 400 for invalid IDs: materialId=$materialId, attachmentId=$attachmentId",
            async ({ materialId, attachmentId }) => {
                const req = createDownloadRequest({
                    params: { materialId, attachmentId },
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
                params: { materialId: "1", attachmentId: "1" },
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
            mockMaterialService.getStudentAttachment.mockResolvedValue({
                path: "test_attachment.txt",
                name: "Test Attachment",
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
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.student,
                },
            });

            await controller.downloadAttachment(req, res);

            expect(
                mockMaterialService.getStudentAttachment,
            ).toHaveBeenCalledWith(1, 1, 3);

            expect(res.setHeader).toHaveBeenCalledWith(
                "Content-Disposition",
                'attachment; filename="Test Attachment"',
            );

            expect(mockPipe).toHaveBeenCalledWith(res);
        });

        it("should return 404 when the file does not exist on disk", async () => {
            mockMaterialService.getStudentAttachment.mockResolvedValue({
                path: "missing.pdf",
                name: "Missing File",
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
                params: { materialId: "1", attachmentId: "1" },
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
