import { NotificationService } from "@/services";
import { ForbiddenError, NotFoundError } from "@/types";
import { Notification } from "@psb/shared/types";
import { mockClassRepository, mockNotificationRepository } from "@test/mocks";

describe("NotificationService (unit)", () => {
    const service = new NotificationService(
        mockClassRepository,
        mockNotificationRepository,
    );

    const notification: Notification = {
        createdAt: new Date(),
        id: 1,
        message: "Test Message",
        read: false,
        title: "Test Title",
        url: null,
        userId: 1,
    };

    describe("getUserNotifications", () => {
        const notifications: Notification[] = [];

        beforeEach(() => {
            mockNotificationRepository.findByUserId.mockResolvedValue(
                notifications,
            );
        });

        it("should delegate to NotificationRepository.findByUserId with default parameters", async () => {
            const result = await service.getUserNotifications(1);

            expect(
                mockNotificationRepository.findByUserId,
            ).toHaveBeenCalledWith(1, undefined, undefined);

            expect(result).toEqual([]);
        });

        it("should delegate to NotificationRepository.findByUserId with specified parameters", async () => {
            const result = await service.getUserNotifications(1, 5, 10);

            expect(
                mockNotificationRepository.findByUserId,
            ).toHaveBeenCalledWith(1, 5, 10);

            expect(result).toEqual([]);
        });
    });

    describe("getUnreadCount", () => {
        it("should delegate to NotificationRepository.getUnreadCount", async () => {
            const count = 42;
            mockNotificationRepository.getUnreadCount.mockResolvedValue(count);

            const result = await service.getUnreadCount(1);

            expect(
                mockNotificationRepository.getUnreadCount,
            ).toHaveBeenCalledWith(1);

            expect(result).toBe(count);
        });
    });

    describe("updateReadStatus", () => {
        it("should update read status successfully", async () => {
            mockNotificationRepository.findById.mockResolvedValue(notification);

            await service.updateReadStatus(1, 1, true);

            expect(
                mockNotificationRepository.updateReadStatus,
            ).toHaveBeenCalledWith(1, true);
        });

        it("should throw if the notification does not exist", async () => {
            mockNotificationRepository.findById.mockResolvedValue(null);

            await expect(
                service.updateReadStatus(999, 1, true),
            ).rejects.toThrow(
                new NotFoundError("notificationService.notificationNotFound"),
            );
        });

        it("should throw if the notification belongs to another user", async () => {
            mockNotificationRepository.findById.mockResolvedValue({
                ...notification,
                userId: 2,
            });

            await expect(service.updateReadStatus(1, 1, true)).rejects.toThrow(
                new ForbiddenError(
                    "notificationService.unauthorizedReadStatusUpdate",
                ),
            );
        });
    });

    describe("publishToUser", () => {
        it("should delegate to NotificationRepository.create", async () => {
            await service.publishToUser(1, "Title", "Message", "/dashboard");

            expect(mockNotificationRepository.create).toHaveBeenCalledWith(
                1,
                "Title",
                "Message",
                "/dashboard",
            );
        });
    });

    describe("publishToClass", () => {
        it("should fetch student IDs and delegate to NotificationRepository.createBulk", async () => {
            const studentIds = [10, 20, 30];

            mockClassRepository.getEnrolledStudentIds.mockResolvedValue(
                studentIds,
            );

            await service.publishToClass(1, "Title", "Message", "/dashboard");

            expect(
                mockClassRepository.getEnrolledStudentIds,
            ).toHaveBeenCalledWith(1);

            expect(mockNotificationRepository.createBulk).toHaveBeenCalledWith(
                studentIds,
                "Title",
                "Message",
                "/dashboard",
            );
        });
    });
});
