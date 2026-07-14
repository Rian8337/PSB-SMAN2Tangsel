import { BookmarkController } from "@/controllers/BookmarkController";
import { BookmarkedMaterial, UserRole } from "@psb/shared/types";
import { mockMaterialBookmarkService } from "@test/mocks";
import {
    createMockRequestFactory,
    createMockResponse,
} from "@test/mocks/express";

const controller = new BookmarkController(mockMaterialBookmarkService);

const createListRequest = createMockRequestFactory<
    unknown,
    BookmarkedMaterial[],
    unknown,
    Partial<{
        session: string;
        semester: string;
        limit: string;
        offset: string;
    }>
>();

const createIdsRequest = createMockRequestFactory<
    unknown,
    number[],
    unknown,
    Partial<{ classSubjectId: string }>
>();

const createMutationRequest = createMockRequestFactory<
    { materialId: string },
    never
>();

describe("getMyBookmarks", () => {
    let res: ReturnType<typeof createMockResponse<BookmarkedMaterial[]>>;

    beforeEach(() => {
        res = createMockResponse();
    });

    it("should return 400 for an invalid session format", async () => {
        const req = createListRequest({
            query: { session: "invalid", semester: "1" },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.getMyBookmarks(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return the service result with the resolved query parameters", async () => {
        mockMaterialBookmarkService.getMyBookmarks.mockResolvedValue([]);

        const req = createListRequest({
            query: {
                session: "2024/2025",
                semester: "1",
                limit: "5",
                offset: "0",
            },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.getMyBookmarks(req, res);

        expect(mockMaterialBookmarkService.getMyBookmarks).toHaveBeenCalledWith(
            3,
            "2024/2025",
            1,
            5,
            0,
        );

        expect(res.json).toHaveBeenCalledWith([]);
    });
});

describe("getBookmarkedMaterialIds", () => {
    let res: ReturnType<typeof createMockResponse<number[]>>;

    beforeEach(() => {
        res = createMockResponse();
    });

    it("should return 400 for a missing classSubjectId", async () => {
        const req = createIdsRequest({
            query: {},
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.getBookmarkedMaterialIds(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return the bookmarked material IDs", async () => {
        mockMaterialBookmarkService.getBookmarkedMaterialIds.mockResolvedValue([
            1, 2,
        ]);

        const req = createIdsRequest({
            query: { classSubjectId: "10" },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.getBookmarkedMaterialIds(req, res);

        expect(
            mockMaterialBookmarkService.getBookmarkedMaterialIds,
        ).toHaveBeenCalledWith(3, 10);

        expect(res.json).toHaveBeenCalledWith([1, 2]);
    });
});

describe("addBookmark", () => {
    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    it("should return 400 for an invalid material ID", async () => {
        const req = createMutationRequest({
            params: { materialId: "abc" },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.addBookmark(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should call addBookmark with UserRole.Student for a student session", async () => {
        const req = createMutationRequest({
            params: { materialId: "1" },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        await controller.addBookmark(req, res);

        expect(mockMaterialBookmarkService.addBookmark).toHaveBeenCalledWith(
            1,
            3,
            UserRole.Student,
        );

        expect(res.sendStatus).toHaveBeenCalledWith(204);
    });

    it("should return 403 for an administrator session", async () => {
        const req = createMutationRequest({
            params: { materialId: "1" },
            sessionData: {
                userId: 1,
                identifier: "1",
                role: UserRole.Administrator,
            },
        });

        await controller.addBookmark(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe("removeBookmark", () => {
    it("should call removeBookmark and return 204", async () => {
        const req = createMutationRequest({
            params: { materialId: "1" },
            sessionData: {
                userId: 3,
                identifier: "0012345678",
                role: UserRole.Student,
            },
        });

        const res = createMockResponse();

        await controller.removeBookmark(req, res);

        expect(mockMaterialBookmarkService.removeBookmark).toHaveBeenCalledWith(
            1,
            3,
        );

        expect(res.sendStatus).toHaveBeenCalledWith(204);
    });
});
