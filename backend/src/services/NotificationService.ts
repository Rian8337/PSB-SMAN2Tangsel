import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassRepository, INotificationRepository } from "@/repositories";
import { inject } from "tsyringe";
import { INotificationService } from "./INotificationService";
import { NotificationDTO } from "@psb/shared/types";
import { ForbiddenError, NotFoundError } from "@/types";

/**
 * A service that is responsible for notification-related operations.
 */
@Injectable(dependencyTokens.notificationService)
export class NotificationService implements INotificationService {
    constructor(
        @inject(dependencyTokens.classRepository)
        private readonly classRepository: IClassRepository,
        @inject(dependencyTokens.notificationRepository)
        private readonly notificationRepository: INotificationRepository,
    ) {}

    getUserNotifications(
        userId: number,
        limit?: number,
        offset?: number,
    ): Promise<NotificationDTO[]> {
        return this.notificationRepository
            .findByUserId(userId, limit, offset)
            .then((notifications) =>
                notifications.map((n) => ({
                    ...n,
                    createdAt: n.createdAt.getTime(),
                })),
            );
    }

    getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepository.getUnreadCount(userId);
    }

    async updateReadStatus(
        notificationId: number,
        userId: number,
        read: boolean,
    ): Promise<void> {
        // Ensure that the notification belongs to the user before updating.
        const notification =
            await this.notificationRepository.findById(notificationId);

        if (!notification) {
            throw new NotFoundError("notificationService.notificationNotFound");
        }

        if (notification.userId !== userId) {
            throw new ForbiddenError(
                "notificationService.unauthorizedReadStatusUpdate",
            );
        }

        await this.notificationRepository.updateReadStatus(
            notificationId,
            read,
        );
    }

    publishToUser(
        userId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void> {
        return this.notificationRepository.create(userId, title, message, url);
    }

    async publishToClass(
        classId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void> {
        const studentIds =
            await this.classRepository.getEnrolledStudentIds(classId);

        return this.notificationRepository.createBulk(
            studentIds,
            title,
            message,
            url,
        );
    }
}
