import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { IClassRepository, INotificationRepository } from "@/repositories";
import { inject } from "tsyringe";
import { INotificationService } from "./INotificationService";
import { NotificationDTO } from "@psb/shared/types";

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
        return this.notificationRepository.findByUserId(userId, limit, offset);
    }

    getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepository.getUnreadCount(userId);
    }

    updateReadStatus(
        notificationId: number,
        userId: number,
        read: boolean,
    ): Promise<void> {
        return this.notificationRepository.updateReadStatus(
            notificationId,
            userId,
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
