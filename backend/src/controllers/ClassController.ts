import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassService } from "@/services";
import { BadRequestError } from "@/types";
import { Class, UserRole } from "@psb/shared/types";
import {
    insertClassSchema,
    validClassNameSchema,
    validSemesterSchema,
    validSessionSchema,
} from "@psb/shared/validator";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles class endpoints.
 */
@Controller("/classes")
export class ClassController extends BaseController {
    constructor(
        @inject(dependencyTokens.classService)
        private readonly classService: IClassService,
    ) {
        super();
    }

    /**
     * Lists classes in a specific academic session and semester, optionally filtered by a search query, and paginated with limit and offset.
     */
    @Get("/list")
    @Roles(UserRole.administrator)
    async list(
        req: Request<
            unknown,
            Class[] | { error: string },
            unknown,
            Partial<{
                session?: string;
                semester?: string;
                query?: string;
                limit?: string;
                offset?: string;
            }>
        >,
        res: Response<Class[] | { error: string }>,
    ) {
        try {
            const session = req.query.session;

            const semester = req.query.semester
                ? parseInt(req.query.semester, 10)
                : undefined;

            const query = req.query.query
                ? decodeURIComponent(req.query.query)
                : undefined;

            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

            const parsedSession = session
                ? validSessionSchema.safeParse(session)
                : undefined;

            if (session && !parsedSession?.success) {
                throw new BadRequestError();
            }

            const parsedSemester = semester
                ? validSemesterSchema.safeParse(semester)
                : undefined;

            if (semester && !parsedSemester?.success) {
                throw new BadRequestError();
            }

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

            const classes = await this.classService.listClasses({
                session: parsedSession?.data,
                semester: parsedSemester?.data,
                query,
                limit,
                offset,
            });

            res.json(classes);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains the details of a class by its unique identifier.
     */
    @Get("/:id")
    @Roles()
    async getById(
        req: Request<{ id: string }, Class | { error: string }>,
        res: Response<Class | { error: string }>,
    ) {
        try {
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            const clazz = await this.classService.getClassById(id);

            res.json(clazz);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Creates a new class with the provided name, academic session, and semester.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async create(
        req: Request<unknown, { error: string }, Partial<Class>>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsedData = insertClassSchema.safeParse(req.body);

            if (!parsedData.success) {
                throw new BadRequestError();
            }

            await this.classService.createClass(
                parsedData.data.name,
                parsedData.data.session,
                parsedData.data.semester,
            );

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the name of an existing class identified by its ID.
     */
    @Patch("/:id")
    @Roles(UserRole.administrator)
    async update(
        req: Request<{ id: string }, { error: string }, { name: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            const parsedName = validClassNameSchema.safeParse(req.body.name);

            if (!parsedName.success) {
                throw new BadRequestError();
            }

            await this.classService.updateClass(id, parsedName.data);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a class by its ID. A class that has associated subjects or students cannot be deleted.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async delete(
        req: Request<{ id: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const id = parseInt(req.params.id, 10);

            if (Number.isNaN(id) || id <= 0) {
                throw new BadRequestError("classController.invalidId");
            }

            await this.classService.deleteClass(id);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
