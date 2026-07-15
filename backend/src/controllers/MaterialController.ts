import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Delete, Get, Post, Put } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import {
    IAttachmentDownloadService,
    IConfigService,
    IMaterialService,
    TempFile,
} from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/types";
import { EnvironmentVariableKey } from "@/types";
import {
    coercedMaterialIdSchema,
    createMaterialBodySchema,
    updateMaterialBodySchema,
} from "@/validators";
import { SubjectMaterial, UserRole } from "@psb/shared/types";
import { createReadStream } from "fs";
import { join } from "path";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

interface UploadedFile {
    readonly path: string;
    readonly originalFilename: string;
}

/**
 * Controller that handles material viewing endpoints for students and teachers.
 */
@Controller("/materials")
export class MaterialController extends BaseController {
    constructor(
        @inject(dependencyTokens.materialService)
        private readonly materialService: IMaterialService,
        @inject(dependencyTokens.configService)
        private readonly configService: IConfigService,
        @inject(dependencyTokens.attachmentDownloadService)
        private readonly attachmentDownloadService: IAttachmentDownloadService,
    ) {
        super();
    }

    /**
     * Returns the details of a material for the currently authenticated student or teacher.
     */
    @Get("/:id")
    @Roles(UserRole.Student, UserRole.Teacher)
    async getMaterial(
        req: ApiRequest<{ id: string }, SubjectMaterial>,
        res: ApiResponse<SubjectMaterial>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedMaterialIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const { sessionData } = req;
            let material: SubjectMaterial;

            switch (sessionData.role) {
                case UserRole.Student:
                    material = await this.materialService.getStudentMaterial(
                        parsedId.data,
                        sessionData.userId,
                    );
                    break;

                case UserRole.Teacher:
                    material = await this.materialService.getTeacherMaterial(
                        parsedId.data,
                        sessionData.userId,
                    );
                    break;

                default:
                    throw new ForbiddenError();
            }

            res.json(material);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Streams a material attachment file to the client.
     */
    @Get("/:materialId/attachments/:attachmentId")
    @Roles(UserRole.Student, UserRole.Teacher)
    async downloadAttachment(
        req: ApiRequest<{ materialId: string; attachmentId: string }>,
        res: ApiResponse,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedMaterialId = coercedMaterialIdSchema.safeParse(
                req.params.materialId,
            );

            if (!parsedMaterialId.success) {
                throw new BadRequestError(
                    parsedMaterialId.error.issues[0].message as MessageKey,
                );
            }

            const parsedAttachmentId = coercedMaterialIdSchema.safeParse(
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
                case UserRole.Student:
                    attachment =
                        await this.materialService.getStudentAttachment(
                            parsedMaterialId.data,
                            parsedAttachmentId.data,
                            sessionData.userId,
                        );
                    break;

                case UserRole.Teacher:
                    attachment =
                        await this.materialService.getTeacherAttachment(
                            parsedMaterialId.data,
                            parsedAttachmentId.data,
                            sessionData.userId,
                        );
                    break;

                default:
                    throw new ForbiddenError();
            }

            const storagePath = this.configService.getEnvironmentVariable(
                EnvironmentVariableKey.StoragePath,
                true,
            );

            const absolutePath = join(storagePath, attachment.path);
            const stream = createReadStream(absolutePath);

            stream.on("open", () => {
                void this.attachmentDownloadService
                    .recordDownload(parsedAttachmentId.data, sessionData.userId)
                    .catch((err: unknown) => {
                        console.error(
                            "Failed to record attachment download",
                            err,
                        );
                    });
            });

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
                        ? new NotFoundError("materialService.notFound")
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

    /**
     * Creates a new material in a class subject. Accepts multipart form data.
     */
    @Post("/")
    @Roles(UserRole.Teacher)
    async createMaterial(
        req: ApiRequest<
            Record<string, never>,
            SubjectMaterial,
            Record<string, unknown>
        >,
        res: ApiResponse<SubjectMaterial>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsed = createMaterialBodySchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const files = this.normalizeFiles(req.body.files);

            const material = await this.materialService.addMaterial(
                parsed.data.classSubjectId,
                req.sessionData.userId,
                parsed.data.title,
                parsed.data.description ?? null,
                parsed.data.visible,
                files,
            );

            res.status(201).json(material);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates an existing material. Accepts multipart form data.
     */
    @Put("/:id")
    @Roles(UserRole.Teacher)
    async updateMaterial(
        req: ApiRequest<{ id: string }, unknown, Record<string, unknown>>,
        res: ApiResponse,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedMaterialIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            const parsed = updateMaterialBodySchema.safeParse(req.body);

            if (!parsed.success) {
                throw new BadRequestError(
                    parsed.error.issues[0].message as MessageKey,
                );
            }

            const files = this.normalizeFiles(req.body.files);

            await this.materialService.updateMaterial(
                parsedId.data,
                req.sessionData.userId,
                parsed.data.title,
                parsed.data.description ?? null,
                parsed.data.visible,
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
     * Deletes a material and all its attachments.
     */
    @Delete("/:id")
    @Roles(UserRole.Teacher)
    async deleteMaterial(req: ApiRequest<{ id: string }>, res: ApiResponse) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedMaterialIdSchema.safeParse(req.params.id);

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            await this.materialService.deleteMaterial(
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
