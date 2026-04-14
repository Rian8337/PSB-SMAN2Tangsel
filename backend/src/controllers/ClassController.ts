import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Patch, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IClassService, IScheduleService } from "@/services";
import { BadRequestError } from "@/types";
import { coercedClassIdSchema, listQuerySchema } from "@/validators";
import { Class, ScheduleDTO, UserRole } from "@psb/shared/types";
import {
    insertClassSchema,
    validClassNameSchema,
    validSemesterSchema,
    validSessionSchema,
} from "@psb/shared/validator";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import z from "zod";

const classListQuerySchema = listQuerySchema.extend({
    session: validSessionSchema.optional(),
    semester: z.coerce.number().pipe(validSemesterSchema).optional(),
});

/**
 * Controller that handles class endpoints.
 */
@Controller("/classes")
export class ClassController extends BaseController {
    constructor(
        @inject(dependencyTokens.classService)
        private readonly classService: IClassService,
        @inject(dependencyTokens.scheduleService)
        private readonly scheduleService: IScheduleService,
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
            const parsed = classListQuerySchema.safeParse(req.query);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const classes = await this.classService.listClasses({
                session: parsed.data.session,
                semester: parsed.data.semester,
                query: parsed.data.query,
                limit: parsed.data.limit,
                offset: parsed.data.offset,
            });

            res.json(classes);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains the schedule for a specific class.
     */
    @Get("/:id/schedules")
    @Roles(UserRole.administrator)
    async getClassSchedule(
        req: Request<{ id: string }, ScheduleDTO[] | { error: string }>,
        res: Response<ScheduleDTO[] | { error: string }>,
    ) {
        try {
            const parsed = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const schedule = await this.scheduleService.getClassSchedule(
                parsed.data,
            );

            res.json(schedule);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains the details of a class by its unique identifier.
     */
    @Get("/:id")
    @Roles(UserRole.administrator)
    async getById(
        req: Request<{ id: string }, Class | { error: string }>,
        res: Response<Class | { error: string }>,
    ) {
        try {
            const parsed = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const clazz = await this.classService.getClassById(parsed.data);

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
                throw new BadRequestError(
                    parsedData.error.issues[0].message as MessageKey,
                );
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
            const parsed = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const parsedName = validClassNameSchema.safeParse(req.body.name);

            if (!parsedName.success) {
                throw new BadRequestError(
                    parsedName.error.issues[0].message as MessageKey,
                );
            }

            await this.classService.updateClass(parsed.data, parsedName.data);

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
            const parsed = coercedClassIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            await this.classService.deleteClass(parsed.data);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
