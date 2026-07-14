import {
    BookmarkedMaterial,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IBookmarkAPIClient } from "./IBookmarkAPIClient";

/**
 * Provides operations for material bookmark-related API calls.
 */
export class BookmarkAPIClient extends APIClient implements IBookmarkAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/bookmarks";
    }

    getMyBookmarks(
        session: ValidSession,
        semester: ValidSemester,
        limit = 20,
        offset = 0,
        signal?: AbortSignal,
    ): Promise<BookmarkedMaterial[]> {
        const url = new URL(this.baseURL + "/");

        url.searchParams.append("session", session);
        url.searchParams.append("semester", semester.toString());
        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("offset", offset.toString());

        return this.get(url, { signal }).then((res) => res.json());
    }

    getBookmarkedMaterialIds(
        classSubjectId: number,
        signal?: AbortSignal,
    ): Promise<number[]> {
        const url = new URL(this.baseURL + "/materials/ids");

        url.searchParams.append("classSubjectId", classSubjectId.toString());

        return this.get(url, { signal }).then((res) => res.json());
    }

    async addBookmark(materialId: number) {
        await this.put(`/materials/${materialId.toString()}`);
    }

    async removeBookmark(materialId: number) {
        await this.delete(`/materials/${materialId.toString()}`);
    }
}
