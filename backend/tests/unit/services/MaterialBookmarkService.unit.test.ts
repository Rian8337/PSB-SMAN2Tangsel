import { MaterialBookmarkService } from "@/services/MaterialBookmarkService";
import { NotFoundError } from "@/types";
import { UserRole } from "@psb/shared/types";
import {
    mockMaterialBookmarkRepository,
    mockMaterialService,
} from "@test/mocks";

const service = new MaterialBookmarkService(
    mockMaterialBookmarkRepository,
    mockMaterialService,
);

describe("addBookmark", () => {
    it("should verify student access via getStudentMaterial before adding a bookmark", async () => {
        await service.addBookmark(1, 3, UserRole.Student);

        expect(mockMaterialService.getStudentMaterial).toHaveBeenCalledWith(
            1,
            3,
        );

        expect(mockMaterialService.getTeacherMaterial).not.toHaveBeenCalled();
        expect(mockMaterialBookmarkRepository.add).toHaveBeenCalledWith(3, 1);
    });

    it("should verify teacher access via getTeacherMaterial before adding a bookmark", async () => {
        await service.addBookmark(1, 2, UserRole.Teacher);

        expect(mockMaterialService.getTeacherMaterial).toHaveBeenCalledWith(
            1,
            2,
        );

        expect(mockMaterialService.getStudentMaterial).not.toHaveBeenCalled();
        expect(mockMaterialBookmarkRepository.add).toHaveBeenCalledWith(2, 1);
    });

    it("should propagate NotFoundError and not create a bookmark when the material is inaccessible", async () => {
        mockMaterialService.getStudentMaterial.mockRejectedValue(
            new NotFoundError("materialService.notFound"),
        );

        await expect(
            service.addBookmark(99, 3, UserRole.Student),
        ).rejects.toThrow(NotFoundError);

        expect(mockMaterialBookmarkRepository.add).not.toHaveBeenCalled();
    });
});

describe("removeBookmark", () => {
    it("should delegate to the repository", async () => {
        await service.removeBookmark(1, 3);

        expect(mockMaterialBookmarkRepository.remove).toHaveBeenCalledWith(
            3,
            1,
        );
    });
});

describe("getBookmarkedMaterialIds", () => {
    it("should delegate to the repository", async () => {
        mockMaterialBookmarkRepository.findBookmarkedMaterialIds.mockResolvedValue(
            [1, 2],
        );

        await expect(service.getBookmarkedMaterialIds(3, 10)).resolves.toEqual([
            1, 2,
        ]);

        expect(
            mockMaterialBookmarkRepository.findBookmarkedMaterialIds,
        ).toHaveBeenCalledWith(3, 10);
    });
});

describe("getMyBookmarks", () => {
    it("should convert bookmarkedAt to epoch milliseconds", async () => {
        const bookmarkedAt = new Date("2024-01-15T00:00:00.000Z");

        mockMaterialBookmarkRepository.findByUserForSession.mockResolvedValue([
            {
                materialId: 1,
                classSubjectId: 10,
                title: "Chapter 1",
                bookmarkedAt,
                subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
                class: { id: 1, name: "X-IPA-1" },
            },
        ]);

        const result = await service.getMyBookmarks(3, "2024/2025", 1, 20, 0);

        expect(result).toEqual([
            {
                materialId: 1,
                classSubjectId: 10,
                title: "Chapter 1",
                bookmarkedAt: bookmarkedAt.getTime(),
                subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
                class: { id: 1, name: "X-IPA-1" },
            },
        ]);
    });
});
