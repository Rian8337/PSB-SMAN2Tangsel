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
     * Marks a notification as read.
     *
     * @param notificationId The ID of the notification to mark as read.
     * @param userId The ID of the user who marked the notification as read. This ensures that only
     * the user who owns the notification can mark it as read.
     */
    markAsRead(notificationId: number, userId: number): Promise<void>;

    /**
     * Marks a notification as unread.
     *
     * @param notificationId The ID of the notification to mark as unread.
     * @param userId The ID of the user who marked the notification as unread. This ensures that only
     * the user who owns the notification can mark it as unread.
     */
    markAsUnread(notificationId: number, userId: number): Promise<void>;

    /**
     * Obtains the count of unread notifications of a user.
     *
     * @param userId The ID of the user.
     * @returns The count of unread notifications of the user.
     */
    getUnreadCount(userId: number): Promise<number>;
}
