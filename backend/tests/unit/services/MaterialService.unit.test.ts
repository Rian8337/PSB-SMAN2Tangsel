import { MaterialService } from "@/services/MaterialService";
import { NotFoundError } from "@/types";
import { SubjectMaterial } from "@psb/shared/types";
import { mockMaterialRepository } from "@test/mocks";

describe("MaterialService (unit)", () => {
    const service = new MaterialService(mockMaterialRepository);

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
});
