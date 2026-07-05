import { seededPrimaryData } from "@psb/shared/tests";
import { NotificationDTO, UserRole } from "@psb/shared/types";
import { app } from "@test/setup/app";
import { loginStudent, seeders, testDbManager } from "@test/utils";
import request from "supertest";

describe("NotificationController (integration)", () => {
    const studentUser = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student && u.active,
    )!;

    const teacherUser = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    let unreadNotificationId: number;
    let readNotificationId: number;
    let teacherNotificationId: number;

    beforeAll(async () => {
        // Unread notification for the student
        const unreadNotif = await seeders.notifications.seedOne({
            userId: studentUser.id,
            title: "Unread Student Alert",
            message: "This is a test unread notification.",
            read: false,
        });

        unreadNotificationId = unreadNotif.id!;

        // Read notification for the student
        const readNotif = await seeders.notifications.seedOne({
            userId: studentUser.id,
            title: "Read Student Alert",
            message: "This is a test read notification.",
            read: true,
        });

        readNotificationId = readNotif.id!;

        // Notification for the teacher (to test ownership boundaries)
        const teacherNotif = await seeders.notifications.seedOne({
            userId: teacherUser.id,
            title: "Teacher Alert",
            message: "This belongs to the teacher.",
            read: false,
        });

        teacherNotificationId = teacherNotif.id!;
    });

    afterAll(testDbManager.cleanupSecondaryTables);

    describe("GET /notifications", () => {
        const endpoint = "/notifications";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        describe("Authenticated Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should return a list of only the user's notifications", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as NotificationDTO[];

                expect(res.status).toBe(200);
                expect(body).toBeInstanceOf(Array);

                const notificationIds = body.map((n) => n.id);

                expect(notificationIds).toContain(unreadNotificationId);
                expect(notificationIds).toContain(readNotificationId);
                expect(notificationIds).not.toContain(teacherNotificationId);
            });

            it("should return 400 for invalid limits", async () => {
                const res = await agent.get(`${endpoint}?limit=-5`);
                expect(res.status).toBe(400);
            });
        });
    });

    describe("GET /notifications/unread-count", () => {
        const endpoint = "/notifications/unread-count";

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        });

        describe("Authenticated Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should return the correct unread count", async () => {
                const res = await agent.get(endpoint);
                const body = res.body as { count: number };

                expect(res.status).toBe(200);
                expect(typeof body.count).toBe("number");
                expect(body.count).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe("PATCH /notifications/:id/read-status", () => {
        let studentEndpoint: string;
        let teacherEndpoint: string;

        beforeAll(() => {
            studentEndpoint = `/notifications/${unreadNotificationId.toString()}/read-status`;
            teacherEndpoint = `/notifications/${teacherNotificationId.toString()}/read-status`;
        });

        it("should return 401 if requested without authentication", async () => {
            const res = await request(app)
                .patch(studentEndpoint)
                .send({ read: true });

            expect(res.status).toBe(401);
        });

        describe("Authenticated Student", () => {
            const agent = request.agent(app);

            beforeAll(async () => {
                await loginStudent(agent);
            });

            it("should successfully update the read status of an owned notification", async () => {
                const res = await agent
                    .patch(studentEndpoint)
                    .send({ read: true });

                expect(res.status).toBe(204);

                // Verify the update took effect
                const getRes = await agent.get("/notifications");

                const updatedNotif = (getRes.body as NotificationDTO[]).find(
                    (n) => n.id === unreadNotificationId,
                );

                expect(updatedNotif?.read).toBe(true);
            });

            it("should return 400 for invalid read status payload", async () => {
                const res = await agent
                    .patch(studentEndpoint)
                    .send({ read: "yes" });

                expect(res.status).toBe(400);
            });

            it("should return 404 for a non-existent notification", async () => {
                const res = await agent
                    .patch(`/notifications/9999999/read-status`)
                    .send({ read: true });

                expect(res.status).toBe(404);
            });

            it("should return 403 when attempting to update another user's notification", async () => {
                // Mark the teacher's notification as read as a student.
                const res = await agent
                    .patch(teacherEndpoint)
                    .send({ read: true });

                expect(res.status).toBe(403);
            });
        });
    });
});
