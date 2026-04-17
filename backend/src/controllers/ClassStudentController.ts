import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IClassStudentService } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import {
    coercedClassIdSchema,
    coercedUserIdSchema,
    listQuerySchema,
    userIdSchema,
} from "@/validators";
import { UserListItem, UserRole } from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles endpoints related to student enrollments in classes.
 */
@Controller("/classes/:id/students")
export class ClassStudentController extends BaseController {
    constructor(
        @inject(dependencyTokens.classStudentService)
        private readonly classStudentService: IClassStudentService,
    ) {
        super();
    }

    /**
     * Obtains a list of students enrolled in a specific class.
     */
    @Get("/")
    @Roles(UserRole.administrator)
    async getEnrolledStudents(
        req: ApiRequest<
            { id: string },
            UserListItem[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: ApiResponse<UserListItem[]>,
    ) {
        try {
            const parsedId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const students = await this.classStudentService.getEnrolledStudents(
                parsedId.data,
                parsedQuery.data.query,
                parsedQuery.data.limit,
                parsedQuery.data.offset,
            );

            res.json(students);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains a list of students not enrolled in a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     */
    @Get("/unenrolled")
    @Roles(UserRole.administrator)
    async getUnenrolledStudents(
        req: ApiRequest<
            { id: string },
            UserListItem[],
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: ApiResponse<UserListItem[]>,
    ) {
        try {
            const parsedId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const students =
                await this.classStudentService.getUnenrolledStudents(
                    parsedId.data,
                    parsedQuery.data.query,
                    parsedQuery.data.limit,
                    parsedQuery.data.offset,
                );

            res.json(students);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Enrolls a student in a class.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async enrollStudent(
        req: ApiRequest<{ id: string }, never, { studentId: number }>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedStudentId = userIdSchema.safeParse(req.body.studentId);

            if (!parsedStudentId.success) {
                throw new BadRequestError(
                    parsedStudentId.error.issues[0].message as MessageKey,
                );
            }

            await this.classStudentService.enrollStudent(
                parsedClassId.data,
                parsedStudentId.data,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Unenrolls a student from a class.
     */
    @Delete("/:studentId")
    @Roles(UserRole.administrator)
    async unenrollStudent(
        req: ApiRequest<{ id: string; studentId: string }, never>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedStudentId = coercedUserIdSchema.safeParse(
                req.params.studentId,
            );

            if (!parsedStudentId.success) {
                throw new BadRequestError(
                    parsedStudentId.error.issues[0].message as MessageKey,
                );
            }

            await this.classStudentService.unenrollStudent(
                parsedClassId.data,
                parsedStudentId.data,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
