import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { ISubmissionService } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import { coercedAssignmentIdSchema } from "@/validators";
import { AssignmentSubmissionRow, UserRole } from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles student submission viewing endpoints for teachers.
 */
@Controller("/assignments")
export class SubmissionController extends BaseController {
    constructor(
        @inject(dependencyTokens.submissionService)
        private readonly submissionService: ISubmissionService,
    ) {
        super();
    }

    /**
     * Returns all student submissions for the given assignment.
     */
    @Get("/:assignmentId/submissions")
    @Roles(UserRole.teacher)
    async getSubmissions(
        req: ApiRequest<{ assignmentId: string }, AssignmentSubmissionRow[]>,
        res: ApiResponse<AssignmentSubmissionRow[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedAssignmentIdSchema.safeParse(
                req.params.assignmentId,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const submissions = await this.submissionService.getSubmissions(
                parsedId.data,
                req.sessionData.userId,
            );

            res.json(submissions);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
