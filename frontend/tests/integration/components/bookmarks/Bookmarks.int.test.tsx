import { Bookmarks } from "@/components/bookmarks/Bookmarks";
import { BookmarkedMaterial } from "@psb/shared/types";
import { mockBookmarkApiClient } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";

const mockBookmarks: BookmarkedMaterial[] = [
    {
        materialId: 1,
        classSubjectId: 10,
        title: "Chapter 1",
        subject: { id: 1, code: "MA1", name: "Matematika Wajib" },
        class: { id: 1, name: "X-IPA-1" },
        bookmarkedAt: Date.now(),
    },
];

function render() {
    return renderWithChakraProvider(
        <Bookmarks session="2024/2025" semester={1} />,
    );
}

describe("Bookmarks (integration)", () => {
    it("should call getMyBookmarks with the given session and semester on mount", () => {
        mockBookmarkApiClient.getMyBookmarks.mockResolvedValue([]);

        render();

        expect(mockBookmarkApiClient.getMyBookmarks).toHaveBeenCalledWith(
            "2024/2025",
            1,
            10,
            0,
            expect.any(AbortSignal),
        );
    });

    it("should display bookmarked materials after loading", async () => {
        mockBookmarkApiClient.getMyBookmarks.mockResolvedValue(mockBookmarks);

        render();

        await waitFor(() => {
            expect(screen.getByText("Chapter 1")).toBeInTheDocument();
            expect(
                screen.getByText("Matematika Wajib · X-IPA-1"),
            ).toBeInTheDocument();
        });
    });

    it("should show the empty state when there are no bookmarks", async () => {
        mockBookmarkApiClient.getMyBookmarks.mockResolvedValue([]);

        render();

        await waitFor(() => {
            expect(screen.getByText("emptyState")).toBeInTheDocument();
        });
    });
});
