import { NotificationController } from "@/controllers";
import { MessageKey } from "@/i18n";
import { NotificationDTO, UserRole } from "@psb/shared/types";
import {
    createMockRequestFactory,
    createMockResponse,
    mockNotificationService,
} from "@test/mocks";

describe("NotificationController (unit)", () => {
    const controller = new NotificationController(mockNotificationService);
    let res: ReturnType<typeof createMockResponse>;

    beforeEach(() => {
        res = createMockResponse();
    });

    describe("getMyNotifications", () => {
        const createMockRequest = createMockRequestFactory<
            unknown,
            { error: string } | NotificationDTO[]
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should return 401 if no session is present", async () => {
            await controller.getMyNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        describe("with session", () => {
            beforeEach(() => {
                req.sessionData = {
                    classId: 1,
                    identifier: "1234567890",
                    role: UserRole.student,
                    userId: 1,
                };
            });

            it("should handle missing limit and offset gracefully", async () => {
                mockNotificationService.getUserNotifications.mockResolvedValue(
                    [],
                );

                await controller.getMyNotifications(req, res);

                expect(
                    mockNotificationService.getUserNotifications,
                ).toHaveBeenCalledWith(1, undefined, undefined);
            });

            it.each<[string, MessageKey]>([
                ["abc", "controller.invalidLimitFormat"],
                ["0", "controller.invalidLimitRange"],
                ["-5", "controller.invalidLimitRange"],
                ["51", "controller.invalidLimitRange"],
            ])(
                "should return 400 for invalid limit: %s",
                async (limit, errorKey) => {
                    req.query.limit = limit;

                    await controller.getMyNotifications(req, res);

                    expect(res.status).toHaveBeenCalledWith(400);
                    expect(res.json).toHaveBeenCalledWith({ error: errorKey });
                },
            );

            it.each<[string, MessageKey]>([
                ["abc", "controller.invalidOffsetFormat"],
                ["-1", "controller.invalidOffsetRange"],
            ])(
                "should return 400 for invalid offset: %s",
                async (offset, errorKey) => {
                    req.query.offset = offset;

                    await controller.getMyNotifications(req, res);

                    expect(res.status).toHaveBeenCalledWith(400);
                    expect(res.json).toHaveBeenCalledWith({ error: errorKey });
                },
            );
        });
    });

    describe("getUnreadCount", () => {
        const createMockRequest = createMockRequestFactory<
            "/unread-count",
            { error: string } | { count: number }
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should return 401 if no session is present", async () => {
            await controller.getUnreadCount(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        describe("with session", () => {
            beforeEach(() => {
                req.sessionData = {
                    classId: 1,
                    identifier: "1234567890",
                    role: UserRole.student,
                    userId: 1,
                };
            });

            it("should return unread count", async () => {
                mockNotificationService.getUnreadCount.mockResolvedValue(5);

                await controller.getUnreadCount(req, res);

                expect(
                    mockNotificationService.getUnreadCount,
                ).toHaveBeenCalledWith(1);

                expect(res.json).toHaveBeenCalledWith({ count: 5 });
            });
        });
    });

    describe("updateReadStatus", () => {
        const createMockRequest = createMockRequestFactory<
            { id: string },
            { error: string },
            { read: boolean }
        >();

        let req: ReturnType<typeof createMockRequest>;

        beforeEach(() => {
            req = createMockRequest();
        });

        it("should return 401 if no session is present", async () => {
            await controller.updateReadStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        describe("with session", () => {
            beforeEach(() => {
                req.sessionData = {
                    classId: 1,
                    identifier: "1234567890",
                    role: UserRole.student,
                    userId: 1,
                };
            });

            it("should update read status", async () => {
                req.params.id = "100";
                req.body.read = true;

                await controller.updateReadStatus(req, res);

                expect(
                    mockNotificationService.updateReadStatus,
                ).toHaveBeenCalledWith(100, 1, true);

                expect(res.sendStatus).toHaveBeenCalledWith(204);
            });

            it.each([["abc"], ["0"], ["-5"]])(
                "should return 400 for invalid notification ID: %s",
                async (id) => {
                    req.params.id = id;

                    await controller.updateReadStatus(req, res);

                    expect(res.status).toHaveBeenCalledWith(400);

                    expect(res.json).toHaveBeenCalledWith({
                        error: "notification.invalidId",
                    });
                },
            );

            it.each([[undefined], [null], ["true"], [1]])(
                "should return 400 for invalid read status: %s",
                async (read) => {
                    req.params.id = "1";
                    req.body = { read: read as unknown as boolean };

                    await controller.updateReadStatus(req, res);

                    expect(res.status).toHaveBeenCalledWith(400);
                    expect(res.json).toHaveBeenCalledWith({
                        error: "notificationController.invalidReadStatusFormat",
                    });
                },
            );
        });
    });
});
