import { NotificationDTO } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { INotificationAPIClient } from "./INotificationAPIClient";

/**
 * Provides operations for notification-related API calls.
 */
export class NotificationAPIClient
    extends APIClient
    implements INotificationAPIClient
{
    protected override get baseURL(): string {
        return super.baseURL + "/notifications";
    }

    getNotifications(
        limit = 5,
        offset = 0,
        signal?: AbortSignal,
    ): Promise<NotificationDTO[]> {
        const url = new URL(this.baseURL + "/");

        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("offset", offset.toString());

        return this.get(url, { signal }).then((res) => res.json());
    }

    getUnreadCount(signal?: AbortSignal): Promise<number> {
        return this.get("/unread-count", { signal })
            .then((res) => res.json() as Promise<{ count: number }>)
            .then((data) => data.count);
    }

    async updateReadStatus(notificationId: number, read: boolean) {
        await this.patch(`/${notificationId.toString()}/read-status`, {
            body: JSON.stringify({ read }),
            headers: { "Content-Type": "application/json" },
        });
    }
}
