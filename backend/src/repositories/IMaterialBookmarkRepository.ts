import { Class, Subject, ValidSemester, ValidSession } from "@psb/shared/types";

/**
 * A row representing a bookmarked material joined with its subject and class context.
 */
export interface BookmarkedMaterialRow {
    readonly materialId: number;
    readonly classSubjectId: number;
    readonly title: string;
    readonly bookmarkedAt: Date;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly class: Pick<Class, "id" | "name">;
}

/**
 * Defines operations for accessing and managing material bookmark data in the database.
 */
export interface IMaterialBookmarkRepository {
    /**
     * Adds a bookmark for a material.
     *
     * @param userId The ID of the user bookmarking the material.
     * @param materialId The ID of the material to bookmark.
     */
    add(userId: number, materialId: number): Promise<void>;

    /**
     * Removes a bookmark for a material.
     *
     * @param userId The ID of the user removing the bookmark.
     * @param materialId The ID of the material to unbookmark.
     */
    remove(userId: number, materialId: number): Promise<void>;

    /**
     * Returns the IDs of materials within a class subject that a user has bookmarked.
     *
     * @param userId The ID of the user.
     * @param classSubjectId The ID of the class subject.
     */
    findBookmarkedMaterialIds(
        userId: number,
        classSubjectId: number,
    ): Promise<number[]>;

    /**
     * Returns the bookmarked materials of a user within an academic session and semester, ordered by most
     * recently bookmarked first.
     *
     * @param userId The ID of the user.
     * @param session The academic session to filter by.
     * @param semester The semester to filter by.
     * @param limit The maximum number of results to return.
     * @param offset The number of results to skip.
     */
    findByUserForSession(
        userId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
        offset: number,
    ): Promise<BookmarkedMaterialRow[]>;
}
