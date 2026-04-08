import { NotificationDTO } from "@psb/shared/types";

/**
 * Provides operations for notification-related API calls.
 */
export interface INotificationAPIClient {
    /**
     * Obtains the notifications of the currently authenticated user.
     *
     * @param limit The maximum number of notifications to obtain. Defaults to 5.
     * @param offset The number of notifications to skip before starting to obtain. Defaults to 0.
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to obtain notifications.
     * @returns The notifications of the currently authenticated user.
     */
    getNotifications(
        limit?: number,
        offset?: number,
        signal?: AbortSignal,
    ): Promise<NotificationDTO[]>;

    /**
     * Obtains the count of unread notifications of the currently authenticated user.
     *
     * @param signal An optional {@link AbortSignal} that can be used to cancel the request to obtain the count of unread notifications.
     * @returns The count of unread notifications.
     */
    getUnreadCount(signal?: AbortSignal): Promise<number>;

    /**
     * Updates the read status of a notification.
     *
     * @param notificationId The ID of the notification to update.
     * @param read The new read status of the notification.
     */
    updateReadStatus(notificationId: number, read: boolean): Promise<void>;
}
