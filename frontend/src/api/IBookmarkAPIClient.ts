import {
    BookmarkedMaterial,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * Provides operations for material bookmark-related API calls.
 */
export interface IBookmarkAPIClient {
    /**
     * Obtains the bookmarked materials of the currently authenticated user within an academic session and semester.
     *
     * @param session The academic session to filter bookmarks by.
     * @param semester The semester to filter bookmarks by.
     * @param limit The maximum number of bookmarks to return. Defaults to 20.
     * @param offset The number of bookmarks to skip before starting to collect the result set. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request.
     * @returns A list of bookmarked materials.
     */
    getMyBookmarks(
        session: ValidSession,
        semester: ValidSemester,
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<BookmarkedMaterial[]>;

    /**
     * Obtains the IDs of materials within a class subject that the currently authenticated user has bookmarked.
     *
     * @param classSubjectId The ID of the class subject.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request.
     * @returns The IDs of bookmarked materials.
     */
    getBookmarkedMaterialIds(
        classSubjectId: number,
        signal?: AbortSignal,
    ): Promise<number[]>;

    /**
     * Bookmarks a material for the currently authenticated user.
     *
     * @param materialId The ID of the material to bookmark.
     */
    addBookmark(materialId: number): Promise<void>;

    /**
     * Removes a bookmark for a material for the currently authenticated user.
     *
     * @param materialId The ID of the material to unbookmark.
     */
    removeBookmark(materialId: number): Promise<void>;
}
