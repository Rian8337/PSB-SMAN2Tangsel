import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { ISubjectService } from "@/services";
import { BadRequestError } from "@/types";
import { coercedSubjectIdSchema, listQuerySchema } from "@/validators";
import { Subject, UserRole } from "@psb/shared/types";
import { insertSubjectSchema } from "@psb/shared/validator";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles subject endpoints.
 */
@Controller("/subjects")
export class SubjectController extends BaseController {
    constructor(
        @inject(dependencyTokens.subjectService)
        private readonly subjectService: ISubjectService,
    ) {
        super();
    }

    /**
     * Lists subjects for display in the UI.
     */
    @Get("/list")
    @Roles()
    async listSubjects(
        req: Request<
            unknown,
            Subject[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<Subject[] | { error: string }>,
    ) {
        try {
            const parsedQuery = listQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const subjects = await this.subjectService.listSubjects(
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
     * Obtains detailed information about a specific subject by their ID.
     */
    @Get("/:id")
    @Roles()
    async getSubject(
        req: Request<{ id: string }, Subject | { error: string }>,
        res: Response<Subject | { error: string }>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const subject = await this.subjectService.findById(parsedId.data);

            res.json(subject);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Creates a new subject.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async createSubject(
        req: Request<unknown, { error: string }, Partial<Subject>>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedData = insertSubjectSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.subjectService.createSubject(
                parsedData.data.code,
                parsedData.data.name,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates an existing subject.
     */
    @Put("/:id")
    @Roles(UserRole.administrator)
    async updateSubject(
        req: Request<{ id: string }, { error: string }, Partial<Subject>>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsedData = insertSubjectSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.subjectService.updateSubject(
                parsedId.data,
                parsedData.data.code,
                parsedData.data.name,
                parsedData.data.active ?? true,
            );

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a subject.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async deleteSubject(
        req: Request<{ id: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedId = coercedSubjectIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            await this.subjectService.deleteSubject(parsedId.data);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
