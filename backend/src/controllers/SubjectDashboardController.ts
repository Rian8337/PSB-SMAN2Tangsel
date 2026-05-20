import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IClassSubjectService } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
} from "@/types";
import { coercedClassSubjectIdSchema } from "@/validators";
import { SubjectDashboard, UserRole } from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles subject dashboard endpoints for students and teachers.
 */
@Controller("/class-subjects")
export class SubjectDashboardController extends BaseController {
    constructor(
        @inject(dependencyTokens.classSubjectService)
        private readonly classSubjectService: IClassSubjectService,
    ) {
        super();
    }

    /**
     * Returns the subject dashboard for the currently authenticated student or teacher.
     */
    @Get("/:id/dashboard")
    @Roles(UserRole.student, UserRole.teacher)
    async getDashboard(
        req: ApiRequest<{ id: string }, SubjectDashboard>,
        res: ApiResponse<SubjectDashboard>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedClassSubjectIdSchema.safeParse(
                req.params.id,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const { sessionData } = req;
            let dashboard: SubjectDashboard;

            switch (sessionData.role) {
                case UserRole.student:
                    dashboard =
                        await this.classSubjectService.getStudentDashboard(
                            parsedId.data,
                            sessionData.userId,
                        );
                    break;

                case UserRole.teacher:
                    dashboard =
                        await this.classSubjectService.getTeacherDashboard(
                            parsedId.data,
                            sessionData.userId,
                        );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(dashboard);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
