import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import {
    IClassSubjectService,
    IScheduleService,
    ISessionService,
} from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    UnauthorizedError,
} from "@/types";
import {
    coercedScheduleIdSchema,
    createScheduleSchema,
    optionalSemesterField,
    optionalSessionField,
    updateScheduleSchema,
} from "@/validators";
import {
    ScheduleDay,
    ScheduleDTO,
    SessionData,
    UserRole,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import z from "zod";
import { BaseController } from "./BaseController";

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
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
    ) {
        super();
    }

    /**
     * Obtains the schedule for the currently authenticated user.
     */
    @Get("/")
    @Roles(UserRole.student, UserRole.teacher)
    async getMySchedule(
        req: ApiRequest<
            unknown,
            ScheduleDTO[],
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: ApiResponse<ScheduleDTO[]>,
    ) {
        try {
            const parsed = z
                .object({
                    session: optionalSessionField,
                    semester: optionalSemesterField,
                })
                .safeParse(req.query);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const { session, semester } = parsed.data;

            const schedule = await this.getSchedule(
                req.sessionData,
                session,
                semester,
            );

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
        req: ApiRequest<unknown, Buffer>,
        res: ApiResponse<Buffer>,
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
     * Fetches a schedule by its ID.
     */
    @Get("/:id")
    @Roles(UserRole.administrator)
    async getById(
        req: ApiRequest<{ id: string }, ScheduleDTO>,
        res: ApiResponse<ScheduleDTO>,
    ) {
        try {
            const parsed = coercedScheduleIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const schedule = await this.scheduleService.getById(parsed.data);

            res.json(schedule);
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
        req: ApiRequest<
            unknown,
            never,
            Partial<{
                classSubjectId: number;
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >,
        res: ApiResponse<never>,
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
        req: ApiRequest<
            { id: string },
            never,
            Partial<{
                day: ScheduleDay;
                startTime: number;
                endTime: number;
            }>
        >,
        res: ApiResponse<never>,
    ) {
        try {
            const paramsParsed = coercedScheduleIdSchema.safeParse(
                req.params.id,
            );

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
                id: paramsParsed.data,
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
        req: ApiRequest<{ id: string }, never>,
        res: ApiResponse<never>,
    ) {
        try {
            const parsed = coercedScheduleIdSchema.safeParse(req.params.id);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            await this.scheduleService.delete(parsed.data);

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    private async getSchedule(
        sessionData: SessionData | undefined,
        session?: ValidSession,
        semester?: ValidSemester,
    ): Promise<ScheduleDTO[]> {
        switch (sessionData?.role) {
            case UserRole.student: {
                let classId: number | undefined;

                if (session && semester) {
                    classId =
                        (await this.classSubjectService.getStudentClassIdForSession(
                            sessionData.userId,
                            session,
                            semester,
                        )) ?? undefined;
                } else if (typeof sessionData.classId === "number") {
                    classId = sessionData.classId;
                }

                return classId !== undefined
                    ? this.scheduleService.getClassSchedule(classId)
                    : [];
            }

            case UserRole.teacher:
                return this.scheduleService.getTeacherSchedule(
                    sessionData.userId,
                    session,
                    semester,
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
