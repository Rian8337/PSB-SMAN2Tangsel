import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IScheduleService } from "@/services";
import { ScheduleDTO, UserRole } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import { ForbiddenError } from "@/types";

/**
 * Controller that handles schedule endpoints.
 */
@Controller("/schedule")
export class ScheduleController extends BaseController {
    constructor(
        @inject(dependencyTokens.scheduleService)
        private readonly scheduleService: IScheduleService,
    ) {
        super();
    }

    @Get("/")
    @Roles(UserRole.student, UserRole.teacher)
    async getMySchedule(
        req: Request<"/", { error: string } | ScheduleDTO[]>,
        res: Response<{ error: string } | ScheduleDTO[]>,
    ) {
        const { sessionData } = req;

        try {
            let schedule: ScheduleDTO[];

            switch (sessionData?.role) {
                case UserRole.student:
                    schedule =
                        typeof sessionData.classId === "number"
                            ? await this.scheduleService.getClassSchedule(
                                  sessionData.classId,
                              )
                            : [];
                    break;

                case UserRole.teacher:
                    schedule = await this.scheduleService.getTeacherSchedule(
                        sessionData.userId,
                    );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(schedule);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
