import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IAssignmentService, IConfigService, TempFile } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/types";
import { EnvironmentVariableKey } from "@/types";
import {
    coercedAssignmentIdSchema,
    createAssignmentBodySchema,
    updateAssignmentBodySchema,
} from "@/validators";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import { createReadStream } from "fs";
import { join } from "path";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

interface UploadedFile {
    readonly path: string;
    readonly originalFilename: string;
}

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
     * Creates a new assignment in a class subject. Accepts multipart form data.
     */
    @Post("/")
    @Roles(UserRole.teacher)
    async createAssignment(
        req: ApiRequest<
            Record<string, never>,
            TeacherSubjectAssignment,
            Record<string, unknown>
        >,
        res: ApiResponse<TeacherSubjectAssignment>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsed = createAssignmentBodySchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const files = this.normalizeFiles(req.body.files);

            const assignment = await this.assignmentService.addAssignment({
                classSubjectId: parsed.data.classSubjectId,
                teacherId: req.sessionData.userId,
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                dueAt: parsed.data.dueAt,
                visible: parsed.data.visible,
                files,
            });

            res.status(201).json(assignment);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates an existing assignment. Accepts multipart form data.
     */
    @Put("/:id")
    @Roles(UserRole.teacher)
    async updateAssignment(
        req: ApiRequest<{ id: string }, unknown, Record<string, unknown>>,
        res: ApiResponse,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedAssignmentIdSchema.safeParse(
                req.params.id,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsed = updateAssignmentBodySchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const files = this.normalizeFiles(req.body.files);

            await this.assignmentService.updateAssignment({
                assignmentId: parsedId.data,
                teacherId: req.sessionData.userId,
                title: parsed.data.title,
                description: parsed.data.description ?? null,
                dueAt: parsed.data.dueAt,
                visible: parsed.data.visible,
                newFiles: files,
                renamedAttachments: parsed.data.renamedAttachments,
                deletedAttachmentIds: parsed.data.deletedAttachmentIds,
            });

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes an assignment and all its attachments and submissions.
     */
    @Delete("/:id")
    @Roles(UserRole.teacher)
    async deleteAssignment(
        req: ApiRequest<{ id: string }>,
        res: ApiResponse,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedAssignmentIdSchema.safeParse(
                req.params.id,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            await this.assignmentService.deleteAssignment(
                parsedId.data,
                req.sessionData.userId,
            );

            res.sendStatus(204);
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

    private normalizeFiles(raw: unknown): TempFile[] {
        if (!raw) {
            return [];
        }

        const items = Array.isArray(raw) ? raw : [raw];

        return items
            .filter(
                (f): f is UploadedFile =>
                    typeof f === "object" &&
                    f !== null &&
                    "path" in f &&
                    "originalFilename" in f,
            )
            .map((f) => ({
                path: f.path,
                originalFilename: f.originalFilename,
            }));
    }
}
