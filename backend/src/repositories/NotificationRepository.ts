import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { notifications } from "@psb/shared/schema";
import { DrizzleDb, NotificationDTO } from "@psb/shared/types";
import { and, count, desc, eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { INotificationRepository } from "./INotificationRepository";

/**
 * Defines operations for accessing and managing notifications data in the database.
 */
@Injectable(dependencyTokens.notificationRepository)
export class NotificationRepository
    extends DatabaseRepository
    implements INotificationRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async create(
        userId: number,
        title: string,
        message: string,
        url?: string,
    ): Promise<void> {
        await this.db
            .insert(notifications)
            .values({ userId, title, message, url });
    }

    async createBulk(
        userIds: readonly number[],
        title: string,
        message: string,
        url?: string,
    ): Promise<void> {
        if (userIds.length === 0) {
            return;
        }

        await this.db
            .insert(notifications)
            .values(userIds.map((userId) => ({ userId, title, message, url })));
    }

    findByUserId(
        userId: number,
        limit = 5,
        offset = 0,
    ): Promise<NotificationDTO[]> {
        return this.db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset)
            .then((res) =>
                res.map((r) => ({
                    ...r,
                    createdAt: r.createdAt.getTime(),
                })),
            );
    }

    async updateReadStatus(
        notificationId: number,
        userId: number,
        read: boolean,
    ): Promise<void> {
        await this.db
            .update(notifications)
            .set({ read })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId),
                ),
            );
    }

    getUnreadCount(userId: number): Promise<number> {
        return this.db
            .select({ value: count() })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.read, false),
                ),
            )
            .then((res) => res.at(0)?.value ?? 0);
    }
}
