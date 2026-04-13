import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IScheduleService, ISessionService } from "@/services";
import { ScheduleDay, ScheduleDTO, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import {
    BadRequestError,
    ForbiddenError,
    SessionData,
    UnauthorizedError,
} from "@/types";
import {
    createScheduleSchema,
    scheduleIdSchema,
    updateScheduleSchema,
} from "@/validators";
import { MessageKey } from "@/i18n";

/**
 * Controller that handles schedule endpoints.
 */
@Controller("/schedule")
export class ScheduleController extends BaseController {
    constructor(
        @inject(dependencyTokens.scheduleService)
        private readonly scheduleService: IScheduleService,
        @inject(dependencyTokens.sessionService)
        private readonly sessionService: ISessionService,
    ) {
        super();
    }

    /**
     * Obtains the schedule for the currently authenticated user.
     */
    @Get("/")
    @Roles(UserRole.student, UserRole.teacher)
    async getMySchedule(
        req: Request<unknown, { error: string } | ScheduleDTO[]>,
        res: Response<{ error: string } | ScheduleDTO[]>,
    ) {
        try {
            const schedule = await this.getSchedule(req.sessionData);

            res.json(schedule);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Generates and downloads an ICS file containing the schedule for the currently authenticated user
     * for the active academic session.
     */
    @Get("/download")
    @Roles(UserRole.student, UserRole.teacher)
    async downloadSchedule(
        req: Request<unknown, Buffer | { error: string }>,
        res: Response<Buffer | { error: string }>,
    ) {
        try {
            const activeSession = await this.sessionService.getActive();
            const schedule = await this.getSchedule(req.sessionData);

            const icsBuffer = this.scheduleService.generateIcsFile(
                schedule,
                activeSession.startTime,
                activeSession.endTime,
            );

            const icsFilename = `${req.t("scheduleController.baseIcsFilename")}-${activeSession.session.replace(/\//g, "-")}-${activeSession.semester.toString()}`;

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${icsFilename}.ics"`,
            );

            res.setHeader("Content-Type", "text/calendar; charset=utf-8");

            res.send(icsBuffer);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Creates a new schedule for a class subject.
     */
    @Post("/")
    @Roles(UserRole.administrator)
    async create(
        req: Request<
            unknown,
            { error: string },
            Partial<{
                classSubjectId: number;
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsed = createScheduleSchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            await this.scheduleService.create(parsed.data);

            res.sendStatus(201);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates an existing schedule by its ID.
     */
    @Put("/:id")
    @Roles(UserRole.administrator)
    async update(
        req: Request<
            { id: string },
            { error: string },
            Partial<{
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >,
        res: Response<{ error: string }>,
    ) {
        try {
            const paramsParsed = scheduleIdSchema.safeParse(req.params);

            if (!paramsParsed.success) {
                throw new BadRequestError(
                    paramsParsed.error.issues[0].message as MessageKey,
                );
            }

            const bodyParsed = updateScheduleSchema.safeParse(req.body);

            if (!bodyParsed.success) {
                throw new BadRequestError(
                    bodyParsed.error.issues[0].message as MessageKey,
                );
            }

            await this.scheduleService.update({
                id: paramsParsed.data.id,
                ...bodyParsed.data,
            });

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes a schedule by its ID.
     */
    @Delete("/:id")
    @Roles(UserRole.administrator)
    async delete(
        req: Request<{ id: string }, { error: string }>,
        res: Response<{ error: string }>,
    ) {
        try {
            const parsed = scheduleIdSchema.safeParse(req.params);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            await this.scheduleService.delete(parsed.data.id);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    private getSchedule(sessionData?: SessionData) {
        switch (sessionData?.role) {
            case UserRole.student:
                return typeof sessionData.classId === "number"
                    ? this.scheduleService.getClassSchedule(sessionData.classId)
                    : Promise.resolve([]);

            case UserRole.teacher:
                return this.scheduleService.getTeacherSchedule(
                    sessionData.userId,
                );

            default:
                if (sessionData) {
                    throw new ForbiddenError();
                } else {
                    throw new UnauthorizedError();
                }
        }
    }
}
