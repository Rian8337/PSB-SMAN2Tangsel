import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { ISubjectService } from "@/services";
import { BadRequestError } from "@/types";
import { Subject, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import { insertSubjectSchema } from "@psb/shared/validator";

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
            const query = req.query.query
                ? decodeURIComponent(req.query.query)
                : undefined;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

            if (limit !== undefined) {
                if (Number.isNaN(limit)) {
                    throw new BadRequestError("controller.invalidLimitFormat");
                }
                if (limit <= 0 || limit > 50) {
                    throw new BadRequestError("controller.invalidLimitRange");
                }
            }

            if (offset !== undefined) {
                if (Number.isNaN(offset)) {
                    throw new BadRequestError("controller.invalidOffsetFormat");
                }
                if (offset < 0) {
                    throw new BadRequestError("controller.invalidOffsetRange");
                }
            }

            const subjects = await this.subjectService.listSubjects(
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
     * Obtains detailed information about a specific subject by their ID.
     */
    @Get("/:id")
    @Roles()
    async getSubject(
        req: Request<{ id: string }, Subject | { error: string }>,
        res: Response<Subject | { error: string }>,
    ) {
        try {
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("subjectController.invalidSubjectId");
            }

            const subject = await this.subjectService.findById(id);

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
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("subjectController.invalidSubjectId");
            }

            const parsedData = insertSubjectSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.subjectService.updateSubject(
                id,
                parsedData.data.code,
                parsedData.data.name,
                parsedData.data.active ?? true,
            );
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
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("subjectController.invalidSubjectId");
            }

            await this.subjectService.deleteSubject(id);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
