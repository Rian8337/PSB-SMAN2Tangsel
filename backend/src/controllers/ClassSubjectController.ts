import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassSubjectService } from "@/services";
import { BadRequestError } from "@/types";
import { ClassSubjectAssignment, Subject, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import {
    classIdSchema,
    coercedClassIdSchema,
    coercedClassSubjectIdSchema,
    listQuerySchema,
    subjectIdSchema,
    userIdSchema,
} from "@/validators";
import { MessageKey } from "@/i18n";

const assignedSubjectsQuerySchema = listQuerySchema.extend({
    classId: classIdSchema,
});

/**
 * Controller that handles endpoints related to subject management of classes.
 */
@Controller("/classes/:id/subjects")
export class ClassSubjectController extends BaseController {
    constructor(
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
    ) {
        super();
    }

    /**
     * Obtains a list of subjects assigned to a specific class, optionally filtered by a search query and paginated with limit and offset parameters.
     */
    @Get("/")
    @Roles(UserRole.administrator)
    async listAssignedSubjects(
        req: Request<
            { id: string },
            ClassSubjectAssignment[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<ClassSubjectAssignment[] | { error: string }>,
    ) {
        try {
            const parsed = assignedSubjectsQuerySchema.safeParse({
                classId: parseInt(req.params.id, 10),
                query: req.query.query,
                limit: req.query.limit,
                offset: req.query.offset,
            });

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const { classId, query, limit, offset } = parsed.data;

            const subjects =
                await this.classSubjectService.listAssignedSubjects(
                    classId,
                    query,
                    limit,
                    offset,
                );

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Lists subjects that are not yet assigned to a specific class for display in the subject selection dropdown when assigning subjects to a class.
     */
    @Get("/unassigned")
    @Roles(UserRole.administrator)
    async listUnassignedSubjects(
        req: Request<
            { id: string },
            Subject[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<Subject[] | { error: string }>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const subjects =
                await this.classSubjectService.listUnassignedSubjects(
                    parsedClassId.data,
                    parsedQuery.data.query,
                    parsedQuery.data.limit,
                    parsedQuery.data.offset,
                );

            res.json(subjects);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Assigns a subject to a class. If the teacher ID is not provided, the subject will be assigned to the class without a teacher.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async assignSubject(
        req: Request<
            { id: string },
            { error: string },
            Partial<{ subjectId: number; teacherId: number | null }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedSubjectId = subjectIdSchema.safeParse(
                req.body.subjectId,
            );

            if (!parsedSubjectId.success) {
                throw new BadRequestError(
                    parsedSubjectId.error.issues[0].message as MessageKey,
                );
            }

            const parsedTeacherId = userIdSchema
                .nullable()
                .safeParse(req.body.teacherId);

            if (!parsedTeacherId.success) {
                throw new BadRequestError(
                    parsedTeacherId.error.issues[0].message as MessageKey,
                );
            }

            await this.classSubjectService.assignSubject(
                parsedClassId.data,
                parsedSubjectId.data,
                parsedTeacherId.data,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the teacher assigned to a class subject. If the teacher ID is not provided, the subject will be unassigned from any teacher.
     */
    @Patch("/:classSubjectId")
    @Roles(UserRole.administrator)
    async updateAssignedSubject(
        req: Request<
            { id: string; classSubjectId: string },
            { error: string },
            Partial<{ teacherId: number | null }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedClassSubjectId = coercedClassSubjectIdSchema.safeParse(
                req.params.classSubjectId,
            );

            if (!parsedClassSubjectId.success) {
                throw new BadRequestError(
                    parsedClassSubjectId.error.issues[0].message as MessageKey,
                );
            }

            const parsedTeacherId = userIdSchema
                .nullable()
                .safeParse(req.body.teacherId);

            if (!parsedTeacherId.success) {
                throw new BadRequestError(
                    parsedTeacherId.error.issues[0].message as MessageKey,
                );
            }

            await this.classSubjectService.updateAssignedSubject(
                parsedClassId.data,
                parsedClassSubjectId.data,
                parsedTeacherId.data,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Removes a subject assignment from a class. This operation is only possible if there are no assignments and materials associated with
     * the class subject assignment.
     */
    @Delete("/:classSubjectId")
    @Roles(UserRole.administrator)
    async unassignSubject(
        req: Request<{ id: string; classSubjectId: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedClassId = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsedClassId.success) {
                throw new BadRequestError(
                    parsedClassId.error.issues[0].message as MessageKey,
                );
            }

            const parsedClassSubjectId = coercedClassSubjectIdSchema.safeParse(
                req.params.classSubjectId,
            );

            if (!parsedClassSubjectId.success) {
                throw new BadRequestError(
                    parsedClassSubjectId.error.issues[0].message as MessageKey,
                );
            }

            await this.classSubjectService.unassignSubject(
                parsedClassId.data,
                parsedClassSubjectId.data,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
