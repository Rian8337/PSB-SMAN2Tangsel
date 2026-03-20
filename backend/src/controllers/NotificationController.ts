import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get, Patch } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { INotificationService } from "@/services";
import { BadRequestError } from "@/types";
import { NotificationDTO } from "@psb/shared/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

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
        req: Request<
            unknown,
            { error: string } | NotificationDTO[],
            unknown,
            Partial<{ limit?: string; offset?: string }>
        >,
        res: Response<{ error: string } | NotificationDTO[]>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const limit = req.query.limit
                ? parseInt(req.query.limit, 10)
                : undefined;

            const offset = req.query.offset
                ? parseInt(req.query.offset, 10)
                : undefined;

            if (limit !== undefined) {
                if (Number.isNaN(limit)) {
                    throw new BadRequestError(
                        "notificationController.invalidLimitFormat",
                    );
                }

                if (limit <= 0 || limit > 50) {
                    throw new BadRequestError(
                        "notificationController.invalidLimitRange",
                    );
                }
            }

            if (offset !== undefined) {
                if (Number.isNaN(offset)) {
                    throw new BadRequestError(
                        "notificationController.invalidOffsetFormat",
                    );
                }

                if (offset < 0) {
                    throw new BadRequestError(
                        "notificationController.invalidOffsetRange",
                    );
                }
            }

            const notifications =
                await this.notificationService.getUserNotifications(
                    req.sessionData.userId,
                    limit,
                    offset,
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
        req: Request<unknown, { error: string } | { count: number }>,
        res: Response<{ error: string } | { count: number }>,
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
    @Patch("/:id/read")
    @Roles()
    async updateReadStatus(
        req: Request<{ id: string }, { error: string }, { read: boolean }>,
        res: Response<{ error: string }>,
    ) {
        if (!this.verifySession(req, res)) {
            return;
        }

        try {
            const notificationId = parseInt(req.params.id, 10);

            if (Number.isNaN(notificationId) || notificationId <= 0) {
                throw new BadRequestError(
                    "notificationController.invalidNotificationIdFormat",
                );
            }

            if (typeof req.body.read !== "boolean") {
                throw new BadRequestError(
                    "notificationController.invalidReadStatusFormat",
                );
            }

            await this.notificationService.updateReadStatus(
                notificationId,
                req.sessionData.userId,
                req.body.read,
            );

            res.sendStatus(204);
        } catch (e) {
            this.handleError(req, res, e);
        }
    }
}
