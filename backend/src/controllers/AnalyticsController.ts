import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IAnalyticsService } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import { analyticsQuerySchema } from "@/validators";
import { DownloadAnalytics, UserRole } from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles download analytics endpoints for teachers.
 */
@Controller("/analytics")
export class AnalyticsController extends BaseController {
    constructor(
        @inject(dependencyTokens.analyticsService)
        private readonly analyticsService: IAnalyticsService,
    ) {
        super();
    }

    /**
     * Obtains the download-analytics payload (weekly time series + top-N ranking) for the currently
     * authenticated teacher's own materials/assignments within an academic session and semester.
     */
    @Get("/downloads")
    @Roles(UserRole.Teacher)
    async getDownloadAnalytics(
        req: ApiRequest<
            unknown,
            DownloadAnalytics,
            unknown,
            Partial<{ session: string; semester: string; limit: string }>
        >,
        res: ApiResponse<DownloadAnalytics>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedQuery = analyticsQuerySchema.safeParse(req.query);

            if (!parsedQuery.success) {
                throw new BadRequestError(
                    parsedQuery.error.issues[0].message as MessageKey,
                );
            }

            const { session, semester, limit } = parsedQuery.data;

            const analytics = await this.analyticsService.getDownloadAnalytics(
                req.sessionData.userId,
                session,
                semester,
                limit ?? 5,
            );

            res.json(analytics);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
