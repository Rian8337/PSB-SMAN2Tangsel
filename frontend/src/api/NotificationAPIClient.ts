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

    getNotifications(limit = 5, offset = 0): Promise<NotificationDTO[]> {
        const url = new URL(this.baseURL + "/");

        url.searchParams.append("limit", limit.toString());
        url.searchParams.append("offset", offset.toString());

        return this.get(url).then((res) => res.json());
    }

    getUnreadCount(): Promise<number> {
        return this.get("/unread-count")
            .then((res) => res.json() as Promise<{ count: number }>)
            .then((data) => data.count);
    }

    async updateReadStatus(
        notificationId: number,
        read: boolean,
    ): Promise<void> {
        await this.patch(`/${notificationId.toString()}/read-status`, {
            body: JSON.stringify({ read }),
            headers: { "Content-Type": "application/json" },
        });
    }
}
