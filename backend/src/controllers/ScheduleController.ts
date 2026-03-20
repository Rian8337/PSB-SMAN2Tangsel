import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IScheduleService, ISessionService } from "@/services";
import { ScheduleDTO, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import { ForbiddenError, SessionData } from "@/types";

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
        if (!this.verifySession(req, res)) {
            return;
        }

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
        if (!this.verifySession(req, res)) {
            return;
        }

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
                throw new ForbiddenError();
        }
    }
}
