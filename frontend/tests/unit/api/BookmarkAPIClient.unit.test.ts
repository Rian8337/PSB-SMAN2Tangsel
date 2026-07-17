import { BookmarkAPIClient } from "@/api";
import { BookmarkedMaterial } from "@psb/shared/types";
import { MockInstance, vi } from "vitest";

describe("BookmarkAPIClient (unit)", () => {
    const client = new BookmarkAPIClient();
    let fetchSpy: MockInstance<typeof fetch>;

    beforeEach(() => {
        fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("getMyBookmarks", () => {
        const mockBookmarks: BookmarkedMaterial[] = [
            {
                materialId: 1,
                classSubjectId: 2,
                title: "Test Material",
                subject: { id: 1, code: "MATH", name: "Mathematics" },
                class: { id: 1, name: "X-1" },
                bookmarkedAt: 1700000000000,
            },
        ];

        it("should send a GET request with the session, semester, and default limit/offset", async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockBookmarks),
            } as Response);

            const result = await client.getMyBookmarks("2024/2025", 1);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/bookmarks/");
            expect(urlStr).toContain("session=2024%2F2025");
            expect(urlStr).toContain("semester=1");
            expect(urlStr).toContain("limit=20");
            expect(urlStr).toContain("offset=0");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBeUndefined();

            expect(result).toEqual(mockBookmarks);
        });

        it("should use the provided limit/offset and pass the AbortSignal", async () => {
            const controller = new AbortController();

            await client.getMyBookmarks(
                "2024/2025",
                2,
                5,
                15,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("semester=2");
            expect(urlStr).toContain("limit=5");
            expect(urlStr).toContain("offset=15");
            expect(options?.signal).toBe(controller.signal);
        });
    });

    describe("getBookmarkedMaterialIds", () => {
        it("should send a GET request scoped to the given class-subject", async () => {
            const controller = new AbortController();

            fetchSpy.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([1, 2, 3]),
            } as Response);

            const result = await client.getBookmarkedMaterialIds(
                2,
                controller.signal,
            );

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/bookmarks/materials/ids");
            expect(urlStr).toContain("classSubjectId=2");
            expect(options?.method).toBe("GET");
            expect(options?.signal).toBe(controller.signal);

            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("addBookmark", () => {
        it("should send a PUT request for the given material ID", async () => {
            await client.addBookmark(42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/bookmarks/materials/42");
            expect(options?.method).toBe("PUT");
        });
    });

    describe("removeBookmark", () => {
        it("should send a DELETE request for the given material ID", async () => {
            await client.removeBookmark(42);

            expect(fetchSpy).toHaveBeenCalledOnce();

            const [url, options] = fetchSpy.mock.calls[0];
            const urlStr = (url as URL | string).toString();

            expect(urlStr).toContain("/bookmarks/materials/42");
            expect(options?.method).toBe("DELETE");
        });
    });
});
