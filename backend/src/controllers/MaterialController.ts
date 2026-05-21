import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n";
import { IConfigService, IMaterialService } from "@/services";
import {
    ApiRequest,
    ApiResponse,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/types";
import { EnvironmentVariableKey } from "@/types";
import { coercedMaterialIdSchema } from "@/validators";
import { SubjectMaterial, UserRole } from "@psb/shared/types";
import { createReadStream, existsSync } from "fs";
import * as nodePath from "path";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

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
    ) {
        super();
    }

    /**
     * Returns the details of a material for the currently authenticated student or teacher.
     */
    @Get("/:id")
    @Roles(UserRole.student, UserRole.teacher)
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
                case UserRole.student:
                    material = await this.materialService.getStudentMaterial(
                        parsedId.data,
                        sessionData.userId,
                    );
                    break;

                case UserRole.teacher:
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
    @Roles(UserRole.student, UserRole.teacher)
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
                case UserRole.student:
                    attachment =
                        await this.materialService.getStudentAttachment(
                            parsedMaterialId.data,
                            parsedAttachmentId.data,
                            sessionData.userId,
                        );
                    break;

                case UserRole.teacher:
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
                EnvironmentVariableKey.storagePath,
                true,
            );

            const absolutePath = nodePath.join(storagePath, attachment.path);

            if (!existsSync(absolutePath)) {
                throw new NotFoundError("materialService.notFound");
            }

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${attachment.name}"`,
            );

            createReadStream(absolutePath).pipe(res);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
