import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IAssignmentService, IConfigService } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/types";
import { EnvironmentVariableKey } from "@/types";
import { coercedAssignmentIdSchema } from "@/validators";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import { createReadStream } from "fs";
import { join } from "path";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * Controller that handles assignment viewing endpoints for students and teachers.
 */
@Controller("/assignments")
export class AssignmentController extends BaseController {
    constructor(
        @inject(dependencyTokens.assignmentService)
        private readonly assignmentService: IAssignmentService,
        @inject(dependencyTokens.configService)
        private readonly configService: IConfigService,
    ) {
        super();
    }

    /**
     * Returns the details of an assignment for the currently authenticated student or teacher.
     */
    @Get("/:id")
    @Roles(UserRole.student, UserRole.teacher)
    async getAssignment(
        req: ApiRequest<
            { id: string },
            StudentSubjectAssignment | TeacherSubjectAssignment
        >,
        res: ApiResponse<StudentSubjectAssignment | TeacherSubjectAssignment>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedAssignmentIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const { sessionData } = req;
            let assignment: StudentSubjectAssignment | TeacherSubjectAssignment;

            switch (sessionData.role) {
                case UserRole.student:
                    assignment =
                        await this.assignmentService.getStudentAssignment(
                            parsedId.data,
                            sessionData.userId,
                        );
                    break;

                case UserRole.teacher:
                    assignment =
                        await this.assignmentService.getTeacherAssignment(
                            parsedId.data,
                            sessionData.userId,
                        );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(assignment);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Streams an assignment attachment file to the client.
     */
    @Get("/:assignmentId/attachments/:attachmentId")
    @Roles(UserRole.student, UserRole.teacher)
    async downloadAttachment(
        req: ApiRequest<{ assignmentId: string; attachmentId: string }>,
        res: ApiResponse,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedAssignmentId = coercedAssignmentIdSchema.safeParse(
                req.params.assignmentId,
            );

            if (!parsedAssignmentId.success) {
                throw new BadRequestError(
                    parsedAssignmentId.error.issues[0].message as MessageKey,
                );
            }

            const parsedAttachmentId = coercedAssignmentIdSchema.safeParse(
                req.params.attachmentId,
            );

            if (!parsedAttachmentId.success) {
                throw new BadRequestError(
                    parsedAttachmentId.error.issues[0].message as MessageKey,
                );
            }

            const { sessionData } = req;
            let attachment: { path: string; name: string };

            switch (sessionData.role) {
                case UserRole.student:
                    attachment =
                        await this.assignmentService.getStudentAttachment(
                            parsedAssignmentId.data,
                            parsedAttachmentId.data,
                            sessionData.userId,
                        );
                    break;

                case UserRole.teacher:
                    attachment =
                        await this.assignmentService.getTeacherAttachment(
                            parsedAssignmentId.data,
                            parsedAttachmentId.data,
                            sessionData.userId,
                        );
                    break;

                default:
                    throw new ForbiddenError();
            }

            const storagePath = this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.storagePath,
                true,
            );

            const absolutePath = join(storagePath, attachment.path);
            const stream = createReadStream(absolutePath);

            stream.on("error", (err) => {
                if (res.headersSent) {
                    res.end();
                    return;
                }

                const isNotFound =
                    (err as NodeJS.ErrnoException).code === "ENOENT";

                this.handleError(
                    req,
                    res,
                    isNotFound
                        ? new NotFoundError("assignmentService.notFound")
                        : err,
                );
            });

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${attachment.name}"`,
            );

            stream.pipe(res);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
