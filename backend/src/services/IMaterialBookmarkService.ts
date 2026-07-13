import {
    BookmarkedMaterial,
    UserRole,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";

/**
 * A service that is responsible for material bookmark-related operations.
 */
export interface IMaterialBookmarkService {
    /**
     * Bookmarks a material for a user. Only materials the user can already access (visible and enrolled, for
     * students; assigned, for teachers) can be bookmarked.
     *
     * @param materialId The ID of the material to bookmark.
     * @param userId The ID of the user bookmarking the material.
     * @param role The role of the user, used to determine which access rule to apply.
     * @throws {NotFoundError} If the material does not exist or is not accessible to the user.
     */
    addBookmark(
        materialId: number,
        userId: number,
        role: UserRole.Student | UserRole.Teacher,
    ): Promise<void>;

    /**
     * Removes a bookmark for a material.
     *
     * @param materialId The ID of the material to unbookmark.
     * @param userId The ID of the user removing the bookmark.
     */
    removeBookmark(materialId: number, userId: number): Promise<void>;

    /**
     * Returns the IDs of materials within a class subject that a user has bookmarked.
     *
     * @param userId The ID of the user.
     * @param classSubjectId The ID of the class subject.
     */
    getBookmarkedMaterialIds(
        userId: number,
        classSubjectId: number,
    ): Promise<number[]>;

    /**
     * Returns the bookmarked materials of a user within an academic session and semester.
     *
     * @param userId The ID of the user.
     * @param session The academic session to filter by.
     * @param semester The semester to filter by.
     * @param limit The maximum number of results to return.
     * @param offset The number of results to skip.
     */
    getMyBookmarks(
        userId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
        offset: number,
    ): Promise<BookmarkedMaterial[]>;
}
