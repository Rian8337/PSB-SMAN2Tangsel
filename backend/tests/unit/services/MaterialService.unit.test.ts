import { MaterialService } from "@/services/MaterialService";
import { NotFoundError } from "@/types";
import { SubjectMaterial } from "@psb/shared/types";
import {
    mockAttachmentService,
    mockClassSubjectRepository,
    mockMaterialRepository,
    mockNotificationService,
} from "@test/mocks";

describe("MaterialService (unit)", () => {
    const service = new MaterialService(
        mockMaterialRepository,
        mockAttachmentService,
        mockClassSubjectRepository,
        mockNotificationService,
    );

    const mockMaterial: SubjectMaterial = {
        id: 1,
        classSubjectId: 10,
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        title: "Chapter 1",
        description: "Introduction",
        visible: true,
        createdAt: "2024-01-15T00:00:00.000Z",
        lastUpdatedAt: "2024-01-23T00:00:00.000Z",
        attachments: [],
    };

    describe("getStudentMaterial", () => {
        it("should return the material when the repository returns one", async () => {
            mockMaterialRepository.getStudentMaterial.mockResolvedValue(
                mockMaterial,
            );

            const result = await service.getStudentMaterial(1, 3);

            expect(
                mockMaterialRepository.getStudentMaterial,
            ).toHaveBeenCalledWith(1, 3);

            expect(result).toEqual(mockMaterial);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockMaterialRepository.getStudentMaterial.mockResolvedValue(null);

            await expect(service.getStudentMaterial(99, 3)).rejects.toThrow(
                new NotFoundError("materialService.notFound"),
            );
        });
    });

    describe("getTeacherMaterial", () => {
        it("should return the material when the repository returns one", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(
                mockMaterial,
            );

            const result = await service.getTeacherMaterial(1, 2);

            expect(
                mockMaterialRepository.getTeacherMaterial,
            ).toHaveBeenCalledWith(1, 2);

            expect(result).toEqual(mockMaterial);
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(null);

            await expect(service.getTeacherMaterial(99, 2)).rejects.toThrow(
                new NotFoundError("materialService.notFound"),
            );
        });
    });

    describe("getStudentAttachment", () => {
        it("should return the attachment when the repository returns one", async () => {
            mockMaterialRepository.getStudentAttachment.mockResolvedValue({
                path: "test.pdf",
                name: "Test File",
            });

            const result = await service.getStudentAttachment(1, 1, 3);

            expect(
                mockMaterialRepository.getStudentAttachment,
            ).toHaveBeenCalledWith(1, 1, 3);

            expect(result).toEqual({ path: "test.pdf", name: "Test File" });
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockMaterialRepository.getStudentAttachment.mockResolvedValue(null);

            await expect(
                service.getStudentAttachment(1, 99, 3),
            ).rejects.toThrow(new NotFoundError("materialService.notFound"));
        });
    });

    describe("getTeacherAttachment", () => {
        it("should return the attachment when the repository returns one", async () => {
            mockMaterialRepository.getTeacherAttachment.mockResolvedValue({
                path: "test.pdf",
                name: "Test File",
            });

            const result = await service.getTeacherAttachment(1, 1, 2);

            expect(
                mockMaterialRepository.getTeacherAttachment,
            ).toHaveBeenCalledWith(1, 1, 2);

            expect(result).toEqual({ path: "test.pdf", name: "Test File" });
        });

        it("should throw NotFoundError when the repository returns null", async () => {
            mockMaterialRepository.getTeacherAttachment.mockResolvedValue(null);

            await expect(
                service.getTeacherAttachment(1, 99, 2),
            ).rejects.toThrow(new NotFoundError("materialService.notFound"));
        });
    });

    describe("addMaterial", () => {
        const mockMaterial: SubjectMaterial = {
            id: 5,
            classSubjectId: 10,
            subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
            title: "New Material",
            description: null,
            visible: false,
            createdAt: "2024-01-15T00:00:00.000Z",
            lastUpdatedAt: "2024-01-15T00:00:00.000Z",
            attachments: [],
        };

        it("should throw NotFoundError when the teacher is not assigned to the class subject", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                null,
            );

            await expect(
                service.addMaterial(10, 2, "Title", null, false, []),
            ).rejects.toThrow(new NotFoundError("materialService.notFound"));
        });

        it("should save files, create material, return the created material, and not send a notification when not visible", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 1 },
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 7,
                name: "file.pdf",
            });

            mockMaterialRepository.addMaterial.mockResolvedValue(mockMaterial);
            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            const result = await service.addMaterial(
                10,
                2,
                "New Material",
                null,
                false,
                [{ path: "/tmp/file.pdf", originalFilename: "file.pdf" }],
            );

            expect(
                mockClassSubjectRepository.getTeacherClassSubject,
            ).toHaveBeenCalledWith(10, 2);

            expect(mockAttachmentService.saveFile).toHaveBeenCalledOnce();

            expect(mockMaterialRepository.addMaterial).toHaveBeenCalledWith(
                10,
                "New Material",
                null,
                false,
                [7],
            );

            expect(result).toEqual(mockMaterial);

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should send a session-scoped notification when the material is visible", async () => {
            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 1 },
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 7,
                name: "file.pdf",
            });

            mockMaterialRepository.addMaterial.mockResolvedValue({
                ...mockMaterial,
                visible: true,
            });

            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            await service.addMaterial(
                10,
                2,
                "New Material",
                "Description",
                true,
                [{ path: "/tmp/file.pdf", originalFilename: "file.pdf" }],
            );

            expect(mockNotificationService.publishToClass).toHaveBeenCalledWith(
                3,
                "New Material",
                "Description",
                "/24251/subjects/10/materials/5",
            );
        });
    });

    describe("updateMaterial", () => {
        const mockExisting: SubjectMaterial = {
            id: 1,
            classSubjectId: 10,
            subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
            title: "Old Title",
            description: null,
            visible: true,
            createdAt: "2024-01-15T00:00:00.000Z",
            lastUpdatedAt: "2024-01-15T00:00:00.000Z",
            attachments: [{ id: 2, name: "existing.pdf" }],
        };

        it("should throw NotFoundError when the material does not belong to the teacher", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(null);

            await expect(
                service.updateMaterial(1, 2, "T", null, true, [], [], []),
            ).rejects.toThrow(new NotFoundError("materialService.notFound"));
        });

        it("should delete, rename, save new files and call updateMaterial with correct keepIds", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(
                mockExisting,
            );

            mockAttachmentService.delete.mockResolvedValue(undefined);

            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );

            mockAttachmentService.saveFile.mockResolvedValue({
                id: 9,
                name: "new.pdf",
            });

            mockMaterialRepository.updateMaterial.mockResolvedValue(undefined);

            await service.updateMaterial(
                1,
                2,
                "New Title",
                "Desc",
                false,
                [{ path: "/tmp/new.pdf", originalFilename: "new.pdf" }],
                [],
                [2], // delete attachment 2
            );

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([2]);

            expect(
                mockAttachmentService.updateRenameAttachments,
            ).toHaveBeenCalledWith([]);

            expect(mockMaterialRepository.updateMaterial).toHaveBeenCalledWith(
                1,
                "New Title",
                "Desc",
                false,
                [9], // only the new attachment since ID 2 was deleted
            );

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should not send a notification when visibility stays the same", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(
                mockExisting, // visible: true
            );

            mockAttachmentService.delete.mockResolvedValue(undefined);
            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );
            mockMaterialRepository.updateMaterial.mockResolvedValue(undefined);

            await service.updateMaterial(
                1,
                2,
                "New Title",
                "Desc",
                true, // already visible, stays visible
                [],
                [],
                [],
            );

            expect(
                mockNotificationService.publishToClass,
            ).not.toHaveBeenCalled();
        });

        it("should send a session-scoped notification when visibility transitions from hidden to visible", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue({
                ...mockExisting,
                visible: false,
            });

            mockAttachmentService.delete.mockResolvedValue(undefined);
            mockAttachmentService.updateRenameAttachments.mockResolvedValue(
                undefined,
            );
            mockMaterialRepository.updateMaterial.mockResolvedValue(undefined);

            mockClassSubjectRepository.getTeacherClassSubject.mockResolvedValue(
                { id: 10, classId: 3, session: "2024/2025", semester: 2 },
            );

            mockNotificationService.publishToClass.mockResolvedValue(undefined);

            await service.updateMaterial(
                1,
                2,
                "New Title",
                "Desc",
                true,
                [],
                [],
                [],
            );

            expect(
                mockClassSubjectRepository.getTeacherClassSubject,
            ).toHaveBeenCalledWith(10, 2);

            expect(mockNotificationService.publishToClass).toHaveBeenCalledWith(
                3,
                "New Title",
                "Desc",
                "/24252/subjects/10/materials/1",
            );
        });
    });

    describe("deleteMaterial", () => {
        it("should throw NotFoundError when the material does not belong to the teacher", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue(null);

            await expect(service.deleteMaterial(1, 2)).rejects.toThrow(
                new NotFoundError("materialService.notFound"),
            );
        });

        it("should delete attachments and then the material", async () => {
            mockMaterialRepository.getTeacherMaterial.mockResolvedValue({
                id: 1,
                classSubjectId: 10,
                subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
                title: "Material",
                description: null,
                visible: true,
                createdAt: "2024-01-15T00:00:00.000Z",
                lastUpdatedAt: "2024-01-15T00:00:00.000Z",
                attachments: [{ id: 3, name: "a.pdf" }],
            });

            mockMaterialRepository.getMaterialAttachmentIds.mockResolvedValue([
                3,
            ]);

            mockAttachmentService.delete.mockResolvedValue(undefined);
            mockMaterialRepository.deleteMaterial.mockResolvedValue(undefined);

            await service.deleteMaterial(1, 2);

            expect(
                mockMaterialRepository.getMaterialAttachmentIds,
            ).toHaveBeenCalledWith(1);

            expect(mockAttachmentService.delete).toHaveBeenCalledWith([3]);

            expect(mockMaterialRepository.deleteMaterial).toHaveBeenCalledWith(
                1,
            );
        });
    });
});
