/**
 * Notification data transferred between frontend and backend.
 */
export interface NotificationDTO {
    readonly createdAt: number;
    readonly id: number;
    readonly title: string;
    readonly message: string;
    readonly read: boolean;
    readonly url: string | null;
}
