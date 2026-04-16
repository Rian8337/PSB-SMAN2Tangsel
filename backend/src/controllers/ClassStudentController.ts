import { Controller } from "@/decorators/controller";
import { BaseController } from "./BaseController";
import { inject } from "tsyringe";
import { IClassStudentService } from "@/services";
import { dependencyTokens } from "@/dependencies/tokens";
import { Delete, Get, Post } from "@/decorators/routes";
import { Roles } from "@/decorators/roles";
import { UserListItem, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import {
    coercedClassIdSchema,
    coercedUserIdSchema,
    listQuerySchema,
    userIdSchema,
} from "@/validators";
import { BadRequestError } from "@/types";
import { MessageKey } from "@/i18n";

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
        req: Request<
            { id: string },
            UserListItem[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<UserListItem[] | { error: string }>,
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
        req: Request<
            { id: string },
            UserListItem[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<UserListItem[] | { error: string }>,
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
        req: Request<{ id: string }, { error: string }, { studentId: number }>,
        res: Response<{ error: string }>,
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
        req: Request<{ id: string; studentId: string }, { error: string }>,
        res: Response<{ error: string }>,
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
