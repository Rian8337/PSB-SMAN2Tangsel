import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get, Patch } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { MessageKey } from "@/i18n/messages";
import { INotificationService } from "@/services";
import { ApiRequest, ApiResponse, BadRequestError } from "@/types";
import { limitSchema, notificationIdSchema, offsetSchema } from "@/validators";
import { NotificationDTO } from "@psb/shared/types";
import { inject } from "tsyringe";
import z from "zod";
import { BaseController } from "./BaseController";

const coercedNotificationIdSchema = z.coerce
    .number({ error: "notification.invalidId" satisfies MessageKey })
    .pipe(notificationIdSchema);

/**
 * Controller that handles notification endpoints.
 */
@Controller("/notifications")
export class NotificationController extends BaseController {
    constructor(
        @inject(dependencyTokens.notificationService)
        private readonly notificationService: INotificationService,
    ) {
        super();
    }

    /**
     * Obtains the notifications of the currently authenticated user.
     */
    @Get("/")
    @Roles()
    async getMyNotifications(
        req: ApiRequest<
            unknown,
            NotificationDTO[],
            unknown,
            Partial<{ limit?: string; offset?: string }>
        >,
        res: ApiResponse<NotificationDTO[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedLimit = limitSchema.safeParse(req.query.limit);

            if (!parsedLimit.success) {
                throw new BadRequestError(
                    parsedLimit.error.issues[0].message as MessageKey,
                );
            }

            const parsedOffset = offsetSchema.safeParse(req.query.offset);

            if (!parsedOffset.success) {
                throw new BadRequestError(
                    parsedOffset.error.issues[0].message as MessageKey,
                );
            }

            const notifications =
                await this.notificationService.getUserNotifications(
                    req.sessionData.userId,
                    parsedLimit.data,
                    parsedOffset.data,
                );

            res.json(notifications);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Obtains the count of unread notifications of a user.
     */
    @Get("/unread-count")
    @Roles()
    async getUnreadCount(
        req: ApiRequest<unknown, { count: number }>,
        res: ApiResponse<{ count: number }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const count = await this.notificationService.getUnreadCount(
                req.sessionData.userId,
            );

            res.json({ count });
        } catch (e) {
            this.handleError(req, res, e);
        }
    }

    /**
     * Updates the read status of a notification. Only the user who owns the notification can update its read status.
     */
    @Patch("/:id/read-status")
    @Roles()
    async updateReadStatus(
        req: ApiRequest<{ id: string }, never, { read: boolean }>,
        res: ApiResponse<never>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const parsedId = coercedNotificationIdSchema.safeParse(
                req.params.id,
            );

            if (!parsedId.success) {
                throw new BadRequestError(
                    parsedId.error.issues[0].message as MessageKey,
                );
            }

            if (typeof req.body.read !== "boolean") {
                throw new BadRequestError(
                    "notificationController.invalidReadStatusFormat",
                );
            }

            await this.notificationService.updateReadStatus(
                parsedId.data,
                req.sessionData.userId,
                req.body.read,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
