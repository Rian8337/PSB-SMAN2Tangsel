import { NotificationDTO } from "@psb/shared/types";

/**
 * A service that is responsible for notification-related operations.
 */
export interface INotificationService {
    /**
     * Obtains the notifications of a user.
     *
     * @param userId The ID of the user to obtain the notifications for.
     * @param limit The maximum number of notifications to obtain. Defaults to 5.
     * @param offset The number of notifications to skip before starting to obtain. Defaults to 0.
     */
    getUserNotifications(
        userId: number,
        limit?: number,
        offset?: number,
    ): Promise<NotificationDTO[]>;

    /**
     * Obtains the count of unread notifications of a user.
     *
     * @param userId The ID of the user.
     * @returns The count of unread notifications of the user.
     */
    getUnreadCount(userId: number): Promise<number>;

    /**
     * Updates the read status of a notification.
     *
     * @param notificationId The ID of the notification to update.
     * @param userId The ID of the user who owns the notification. This ensures that only the user who
     * owns the notification can update its read status.
     * @param read The new read status of the notification.
     */
    updateReadStatus(
        notificationId: number,
        userId: number,
        read: boolean,
    ): Promise<void>;

    /**
     * Publishes a notification to a user.
     *
     * @param userId The ID of the user to publish the notification to.
     * @param title The title of the notification.
     * @param message The message of the notification.
     * @param url The URL associated with the notification, if any.
     */
    publishToUser(
        userId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void>;

    /**
     * Publishes a notification to all users in a class.
     *
     * @param classId The ID of the class to publish the notification to.
     * @param title The title of the notification.
     * @param message The message of the notification.
     * @param url The URL associated with the notification, if any.
     */
    publishToClass(
        classId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void>;
}
