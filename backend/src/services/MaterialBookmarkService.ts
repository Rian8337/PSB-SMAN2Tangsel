import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IMaterialBookmarkRepository } from "@/repositories";
import {
    BookmarkedMaterial,
    UserRole,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { IMaterialBookmarkService } from "./IMaterialBookmarkService";
import { IMaterialService } from "./IMaterialService";

/**
 * A service that is responsible for material bookmark-related operations.
 */
@Injectable(dependencyTokens.materialBookmarkService)
export class MaterialBookmarkService implements IMaterialBookmarkService {
    constructor(
        @inject(dependencyTokens.materialBookmarkRepository)
        private readonly materialBookmarkRepository: IMaterialBookmarkRepository,
        @inject(dependencyTokens.materialService)
        private readonly materialService: IMaterialService,
    ) {}

    async addBookmark(
        materialId: number,
        userId: number,
        role: UserRole.Student | UserRole.Teacher,
    ) {
        // Reuses the existing material access checks (enrollment/visibility for students, assignment
        // ownership for teachers) so bookmarking can never leak the existence of an inaccessible material.
        if (role === UserRole.Student) {
            await this.materialService.getStudentMaterial(materialId, userId);
        } else {
            await this.materialService.getTeacherMaterial(materialId, userId);
        }

        await this.materialBookmarkRepository.add(userId, materialId);
    }

    removeBookmark(materialId: number, userId: number) {
        return this.materialBookmarkRepository.remove(userId, materialId);
    }

    getBookmarkedMaterialIds(userId: number, classSubjectId: number) {
        return this.materialBookmarkRepository.findBookmarkedMaterialIds(
            userId,
            classSubjectId,
        );
    }

    getMyBookmarks(
        userId: number,
        session: ValidSession,
        semester: ValidSemester,
        limit: number,
        offset: number,
    ): Promise<BookmarkedMaterial[]> {
        return this.materialBookmarkRepository
            .findByUserForSession(userId, session, semester, limit, offset)
            .then((rows) =>
                rows.map((row) => ({
                    ...row,
                    bookmarkedAt: row.bookmarkedAt.getTime(),
                })),
            );
    }
}
