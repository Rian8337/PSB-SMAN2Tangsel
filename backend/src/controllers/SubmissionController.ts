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
     * Downloads a ZIP archive of student submission attachments for the given assignment.
     */
    @Get("/:assignmentId/submissions/download")
    @Roles(UserRole.teacher)
    async downloadSubmissions(
        req: ApiRequest<
            { assignmentId: string },
            Buffer,
            unknown,
            { studentId?: string }
        >,
        res: ApiResponse<Buffer>,
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

            let studentId: number | undefined;

            if (req.query.studentId !== undefined) {
                const parsedStudentId = coercedAssignmentIdSchema.safeParse(
                    req.query.studentId,
                );

                if (!parsedStudentId.success) {
                    throw new BadRequestError(
                        parsedStudentId.error.issues[0].message as MessageKey,
                    );
                }

                studentId = parsedStudentId.data;
            }

            const zipBuffer = await this.submissionService.downloadSubmissions(
                parsedId.data,
                req.sessionData.userId,
                studentId,
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="submissions-${parsedId.data.toString()}.zip"`,
            );

            res.setHeader("Content-Type", "application/zip");
            res.send(zipBuffer);
        } catch (e) {
            this.handleError(req, res, e);
        }
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
