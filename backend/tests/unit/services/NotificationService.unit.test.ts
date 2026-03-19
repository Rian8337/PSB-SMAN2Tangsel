import { NotificationService } from "@/services";
import { NotificationDTO } from "@psb/shared/types";
import { mockClassRepository, mockNotificationRepository } from "@test/mocks";

describe("NotificationService (unit)", () => {
    const service = new NotificationService(
        mockClassRepository,
        mockNotificationRepository,
    );

    describe("getUserNotifications", () => {
        const notifications: NotificationDTO[] = [];

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

            expect(result).toBe(notifications);
        });

        it("should delegate to NotificationRepository.findByUserId with specified parameters", async () => {
            const result = await service.getUserNotifications(1, 5, 10);

            expect(
                mockNotificationRepository.findByUserId,
            ).toHaveBeenCalledWith(1, 5, 10);

            expect(result).toBe(notifications);
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
        it("should delegate to NotificationRepository.updateReadStatus", async () => {
            await service.updateReadStatus(100, 1, true);

            expect(
                mockNotificationRepository.updateReadStatus,
            ).toHaveBeenCalledWith(100, 1, true);
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
