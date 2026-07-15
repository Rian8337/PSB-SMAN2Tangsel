import { MaterialController } from "@/controllers/MaterialController";
import { SubjectMaterial, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockAttachmentDownloadService,
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
        mockAttachmentDownloadService,
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
        attachments: [{ id: 1, name: "buku.pdf", downloadCount: 0 }],
    };

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getMaterial", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            SubjectMaterial
        >();

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
                        role: UserRole.Student,
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
                    role: UserRole.Administrator,
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
                    role: UserRole.Student,
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
                    role: UserRole.Teacher,
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

    describe("createMaterial", () => {
        const createMockRequest = createMockRequestFactory<
            Record<string, never>,
            SubjectMaterial,
            Record<string, unknown>
        >();

        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ body: {} });

            await controller.createMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(mockMaterialService.addMaterial).not.toHaveBeenCalled();
        });

        it("should return 400 when classSubjectId is missing", async () => {
            const req = createMockRequest({
                body: { title: "Title" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.createMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 when title is empty", async () => {
            const req = createMockRequest({
                body: { classSubjectId: "1", title: "" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.createMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 201 with the created material on success", async () => {
            const mockMaterial: SubjectMaterial = {
                id: 5,
                classSubjectId: 1,
                subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
                title: "New Material",
                description: null,
                visible: false,
                createdAt: "2024-01-01T00:00:00.000Z",
                lastUpdatedAt: "2024-01-01T00:00:00.000Z",
                attachments: [],
            };
            mockMaterialService.addMaterial.mockResolvedValue(mockMaterial);

            const req = createMockRequest({
                body: {
                    classSubjectId: "1",
                    title: "New Material",
                    visible: "false",
                },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.createMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockMaterial);
        });
    });

    describe("updateMaterial", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            unknown,
            Record<string, unknown>
        >();

        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { id: "1" }, body: {} });

            await controller.updateMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should return 400 for an invalid ID", async () => {
            const req = createMockRequest({
                params: { id: "abc" },
                body: { title: "Title" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.updateMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 when title is missing", async () => {
            const req = createMockRequest({
                params: { id: "1" },
                body: {},
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.updateMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 200 on success", async () => {
            mockMaterialService.updateMaterial.mockResolvedValue(undefined);

            const req = createMockRequest({
                params: { id: "1" },
                body: { title: "Updated Title", visible: "true" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.updateMaterial(req, res);

            expect(mockMaterialService.updateMaterial).toHaveBeenCalledWith(
                1,
                2,
                "Updated Title",
                null,
                true,
                [],
                [],
                [],
            );
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });
    });

    describe("deleteMaterial", () => {
        const createMockRequest = createMockRequestFactory<{ id: string }>();

        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({ params: { id: "1" } });

            await controller.deleteMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should return 400 for an invalid ID", async () => {
            const req = createMockRequest({
                params: { id: "abc" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.deleteMaterial(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 204 on success", async () => {
            mockMaterialService.deleteMaterial.mockResolvedValue(undefined);

            const req = createMockRequest({
                params: { id: "1" },
                sessionData: {
                    userId: 2,
                    identifier: "2",
                    role: UserRole.Teacher,
                },
            });

            await controller.deleteMaterial(req, res);

            expect(mockMaterialService.deleteMaterial).toHaveBeenCalledWith(
                1,
                2,
            );
            expect(res.sendStatus).toHaveBeenCalledWith(204);
        });
    });

    describe("downloadAttachment", () => {
        const createMockRequest = createMockRequestFactory<{
            materialId: string;
            attachmentId: string;
        }>();

        it("should return 401 if no session is present", async () => {
            const req = createMockRequest({
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
                const req = createMockRequest({
                    params: { materialId, attachmentId },
                    sessionData: {
                        userId: 3,
                        identifier: "0012345678",
                        role: UserRole.Student,
                    },
                });

                await controller.downloadAttachment(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            },
        );

        it("should return 403 for an administrator session", async () => {
            const req = createMockRequest({
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 1,
                    identifier: "1",
                    role: UserRole.Administrator,
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

            const req = createMockRequest({
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.Student,
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

        it("should record a download when the file stream opens", async () => {
            mockMaterialService.getStudentAttachment.mockResolvedValue({
                path: "test_attachment.txt",
                name: "Test Attachment",
            });
            mockConfigService.getEnvironmentVariable.mockReturnValue(
                "/storage",
            );
            mockAttachmentDownloadService.recordDownload.mockResolvedValue(
                undefined,
            );

            let openHandler: (() => void) | undefined;

            fsMock.createReadStream.mockReturnValue({
                on: vi.fn((event: string, handler: () => void) => {
                    if (event === "open") {
                        openHandler = handler;
                    }
                }),
                pipe: vi.fn(),
            });

            const req = createMockRequest({
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.Student,
                },
            });

            await controller.downloadAttachment(req, res);

            openHandler?.();

            expect(
                mockAttachmentDownloadService.recordDownload,
            ).toHaveBeenCalledWith(1, 3);
        });

        it("should not fail the download if recording it throws", async () => {
            mockMaterialService.getStudentAttachment.mockResolvedValue({
                path: "test_attachment.txt",
                name: "Test Attachment",
            });

            mockConfigService.getEnvironmentVariable.mockReturnValue(
                "/storage",
            );

            mockAttachmentDownloadService.recordDownload.mockRejectedValue(
                new Error("db error"),
            );

            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => undefined);

            let openHandler: (() => void) | undefined;

            fsMock.createReadStream.mockReturnValue({
                on: vi.fn((event: string, handler: () => void) => {
                    if (event === "open") {
                        openHandler = handler;
                    }
                }),
                pipe: vi.fn(),
            });

            const req = createMockRequest({
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.Student,
                },
            });

            await controller.downloadAttachment(req, res);

            openHandler?.();

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Failed to record attachment download",
                    expect.any(Error),
                );
            });

            consoleErrorSpy.mockRestore();
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
                ((err: NodeJS.ErrnoException) => void) | undefined;

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

            const req = createMockRequest({
                params: { materialId: "1", attachmentId: "1" },
                sessionData: {
                    userId: 3,
                    identifier: "0012345678",
                    role: UserRole.Student,
                },
            });

            await controller.downloadAttachment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
