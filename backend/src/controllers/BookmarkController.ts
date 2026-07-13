import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IMaterialBookmarkService } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
} from "@/types";
import {
    bookmarkListQuerySchema,
    coercedClassSubjectIdSchema,
    coercedMaterialIdSchema,
} from "@/validators";
import { BookmarkedMaterial, UserRole } from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles material bookmark endpoints for students and teachers.
 */
@Controller("/bookmarks")
export class BookmarkController extends BaseController {
    constructor(
        @inject(dependencyTokens.materialBookmarkService)
        private readonly materialBookmarkService: IMaterialBookmarkService,
    ) {
        super();
    }

    /**
     * Obtains the bookmarked materials of the currently authenticated user within an academic session and semester.
     */
    @Get("/")
    @Roles(UserRole.Student, UserRole.Teacher)
    async getMyBookmarks(
        req: ApiRequest<
            unknown,
            BookmarkedMaterial[],
            unknown,
            Partial<{
                session: string;
                semester: string;
                limit: string;
                offset: string;
            }>
        >,
        res: ApiResponse<BookmarkedMaterial[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedQuery = bookmarkListQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const { session, semester, limit, offset } = parsedQuery.data;

            const bookmarks = await this.materialBookmarkService.getMyBookmarks(
                req.sessionData.userId,
                session,
                semester,
                limit ?? 20,
                offset ?? 0,
            );

            res.json(bookmarks);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains the IDs of materials within a class subject that the currently authenticated user has bookmarked.
     */
    @Get("/materials/ids")
    @Roles(UserRole.Student, UserRole.Teacher)
    async getBookmarkedMaterialIds(
        req: ApiRequest<
            unknown,
            number[],
            unknown,
            Partial<{ classSubjectId: string }>
        >,
        res: ApiResponse<number[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedClassSubjectId = coercedClassSubjectIdSchema.safeParse(
                req.query.classSubjectId,
            );

            if (!parsedClassSubjectId.success) {
                throw new BadRequestError(
                    parsedClassSubjectId.error.issues[0].message as MessageKey,
                );
            }

            const materialIds =
                await this.materialBookmarkService.getBookmarkedMaterialIds(
                    req.sessionData.userId,
                    parsedClassSubjectId.data,
                );

            res.json(materialIds);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Bookmarks a material for the currently authenticated user. Idempotent.
     */
    @Put("/materials/:materialId")
    @Roles(UserRole.Student, UserRole.Teacher)
    async addBookmark(
        req: ApiRequest<{ materialId: string }, never>,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedMaterialIdSchema.safeParse(
                req.params.materialId,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const { sessionData } = req;

            switch (sessionData.role) {
                case UserRole.Student:
                    await this.materialBookmarkService.addBookmark(
                        parsedId.data,
                        sessionData.userId,
                        UserRole.Student,
                    );
                    break;

                case UserRole.Teacher:
                    await this.materialBookmarkService.addBookmark(
                        parsedId.data,
                        sessionData.userId,
                        UserRole.Teacher,
                    );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Removes a bookmark for a material for the currently authenticated user. Idempotent.
     */
    @Delete("/materials/:materialId")
    @Roles(UserRole.Student, UserRole.Teacher)
    async removeBookmark(
        req: ApiRequest<{ materialId: string }, never>,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedMaterialIdSchema.safeParse(
                req.params.materialId,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            await this.materialBookmarkService.removeBookmark(
                parsedId.data,
                req.sessionData.userId,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
