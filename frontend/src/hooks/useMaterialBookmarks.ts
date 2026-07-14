import { useBookmarkApiClient } from "@/providers/api/bookmark-api-provider";
import { useCallback, useEffect, useState, useTransition } from "react";

/**
 * Provides hooks for managing and accessing a user's bookmarked materials within a single class subject.
 */
export function useMaterialBookmarks(classSubjectId: number) {
    const bookmarkApiClient = useBookmarkApiClient();

    const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
    const [isPending, startTransition] = useTransition();

    const fetchBookmarkedIds = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const ids = await bookmarkApiClient.getBookmarkedMaterialIds(
                    classSubjectId,
                    signal,
                );

                setBookmarkedIds(new Set(ids));
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                console.error("Failed to fetch bookmarked materials", e);
            }
        },
        [bookmarkApiClient, classSubjectId],
    );

    useEffect(() => {
        const controller = new AbortController();

        startTransition(() => fetchBookmarkedIds(controller.signal));

        return () => {
            controller.abort();
        };
    }, [fetchBookmarkedIds]);

    const toggleBookmark = async (materialId: number) => {
        const wasBookmarked = bookmarkedIds.has(materialId);

        setBookmarkedIds((prev) => {
            const next = new Set(prev);

            if (wasBookmarked) {
                next.delete(materialId);
            } else {
                next.add(materialId);
            }

            return next;
        });

        try {
            if (wasBookmarked) {
                await bookmarkApiClient.removeBookmark(materialId);
            } else {
                await bookmarkApiClient.addBookmark(materialId);
            }
        } catch (e) {
            console.error("Failed to update bookmark", e);
            void fetchBookmarkedIds();
        }
    };

    return {
        isBookmarked: (materialId: number) => bookmarkedIds.has(materialId),
        toggleBookmark,
        isLoading: isPending,
    };
}
