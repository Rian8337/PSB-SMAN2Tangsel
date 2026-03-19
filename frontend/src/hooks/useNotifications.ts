import { useNotificationApiClient } from "@/providers/api/notification-api-provider";
import { NotificationDTO } from "@psb/shared/types";
import { useCallback, useEffect, useState } from "react";

/**
 * Provides hooks for managing and accessing notifications.
 */
export function useNotifications() {
    const notificationApiClient = useNotificationApiClient();

    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);

        try {
            const [notifications, unreadCount] = await Promise.all([
                notificationApiClient.getNotifications(),
                notificationApiClient.getUnreadCount(),
            ]);

            setNotifications(notifications);
            setUnreadCount(unreadCount);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setIsLoading(false);
        }
    }, [notificationApiClient]);

    useEffect(() => {
        void fetchInitialData();
    }, [fetchInitialData]);

    const updateReadStatus = async (notificationId: number, read: boolean) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, read } : n)),
        );

        setUnreadCount((prev) => Math.max(0, prev + (read ? -1 : 1)));

        try {
            await notificationApiClient.updateReadStatus(notificationId, read);
        } catch (e) {
            console.error("Failed to update notification read status", e);
            void fetchInitialData();
        }
    };

    return {
        notifications,
        unreadCount,
        isLoading,
        updateReadStatus,
        refresh: fetchInitialData,
    };
}
