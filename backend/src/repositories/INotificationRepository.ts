import { NotificationDTO } from "@psb/shared/types";

/**
 * Defines operations for accessing and managing notifications data in the database.
 */
export interface INotificationRepository {
    /**
     * Creates a notification for a single user.
     *
     * @param userId The ID of the user.
     * @param title The title of the notification.
     * @param message The message of the notification.
     * @param url The URL associated with the notification, if any.
     */
    create(
        userId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void>;

    /**
     * Creates notifications for multiple users.
     *
     * @param userIds The IDs of the users.
     * @param title The title of the notifications.
     * @param message The message of the notifications.
     * @param url The URL associated with the notifications, if any.
     */
    createBulk(
        userIds: readonly number[],
        title: string,
        message: string,
        url?: string,
    ): Promise<void>;

    /**
     * Fetches the notifications of a user, ordered by creation time in descending order (most recent first).
     *
     * @param userId The ID of the user.
     * @param limit The maximum number of notifications to fetch. Defaults to 5.
     * @param offset The number of notifications to skip before starting to fetch. Defaults to 0.
     * @returns The notifications of the user.
     */
    findByUserId(
        userId: number,
        limit?: number,
        offset?: number,
    ): Promise<NotificationDTO[]>;

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
     * Obtains the count of unread notifications of a user.
     *
     * @param userId The ID of the user.
     * @returns The count of unread notifications of the user.
     */
    getUnreadCount(userId: number): Promise<number>;
}
