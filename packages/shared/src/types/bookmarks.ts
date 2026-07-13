import { materialBookmarks } from "../database/schema";
import { Class } from "./classes";
import { Subject } from "./subjects";

/**
 * The type of a material bookmark as stored in the database.
 */
export type MaterialBookmark = typeof materialBookmarks.$inferSelect;

/**
 * A bookmarked material entry as shown in the "My Bookmarks" list, displayed to students and teachers.
 */
export interface BookmarkedMaterial {
    readonly materialId: number;
    readonly classSubjectId: number;
    readonly title: string;
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly class: Pick<Class, "id" | "name">;
    readonly bookmarkedAt: number;
}
