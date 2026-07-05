import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { ISubmissionService, TempFile } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import {
    coercedAssignmentIdSchema,
    updateSubmissionBodySchema,
} from "@/validators";
import {
    AssignmentSubmissionRow,
    SubjectAssignmentSubmission,
    UserRole,
} from "@psb/shared/types";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

interface UploadedFile {
    readonly path: string;
    readonly originalFilename: string;
}

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
    @Roles(UserRole.Teacher)
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
    @Roles(UserRole.Teacher)
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

    /**
     * Creates a new submission for the authenticated student on the given assignment.
     */
    @Post("/:assignmentId/submissions")
    @Roles(UserRole.Student)
    async createSubmission(
        req: ApiRequest<
            { assignmentId: string },
            SubjectAssignmentSubmission,
            Record<string, unknown>
        >,
        res: ApiResponse<SubjectAssignmentSubmission>,
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

            const files = this.normalizeFiles(req.body.files);

            const submission = await this.submissionService.addSubmission(
                parsedId.data,
                req.sessionData.userId,
                files,
            );

            res.status(201).json(submission);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the submission of the authenticated student on the given assignment.
     */
    @Put("/:assignmentId/submissions")
    @Roles(UserRole.Student)
    async updateSubmission(
        req: ApiRequest<
            { assignmentId: string },
            unknown,
            Record<string, unknown>
        >,
        res: ApiResponse,
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

            const parsed = updateSubmissionBodySchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const files = this.normalizeFiles(req.body.files);

            await this.submissionService.updateSubmission(
                parsedId.data,
                req.sessionData.userId,
                files,
                parsed.data.renamedAttachments,
                parsed.data.deletedAttachmentIds,
            );

            res.sendStatus(200);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Deletes the submission of the authenticated student on the given assignment.
     */
    @Delete("/:assignmentId/submissions")
    @Roles(UserRole.Student)
    async deleteSubmission(
        req: ApiRequest<{ assignmentId: string }>,
        res: ApiResponse,
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

            await this.submissionService.deleteSubmission(
                parsedId.data,
                req.sessionData.userId,
            );

            res.sendStatus(204);
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
