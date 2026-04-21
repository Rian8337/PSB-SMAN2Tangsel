import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginStudent } from "./utils/login";

test.describe("Notifications", () => {
    const student = seededPrimaryData.students[0];

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;
        const subject = seededPrimaryData.subjects[0];
        const session = seededPrimaryData.sessions[0];

        const clazz = await seeders.classes.seedOne({
            id: 1,
            name: "X-1",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: clazz.id!,
            studentId: student.userId,
        });

        const classSubject = await seeders.classSubjects.seedOne({
            id: 1,
            classId: clazz.id!,
            subjectId: subject.id,
        });

        await seeders.schedules.seedOne({
            id: 1,
            classSubjectId: classSubject.id!,
            day: ScheduleDay.monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9, 30),
        });

        await seeders.notifications.seedMany(
            {
                userId: student.userId,
                title: "T1",
                message: "TN1",
                read: false,
                createdAt: new Date(),
            },
            {
                userId: student.userId,
                title: "T2",
                message: "TN2",
                read: true,
                // 1 day ago
                createdAt: new Date(Date.now() - 24 * 1000 * 60 * 60),
            },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginStudent(page);
    });

    test("should display the correct unread badge count", async ({ page }) => {
        const bellTrigger = page.getByRole("button", {
            name: /notifications/i,
        });

        const badge = bellTrigger.locator("xpath=following-sibling::div");

        await expect(badge).toHaveText("1");
    });

    test("should display notifications in the correct order and with correct read status", async ({
        page,
    }) => {
        const bellTrigger = page.getByRole("button", {
            name: /notifications/i,
        });

        await bellTrigger.click();

        const popoverBody = page.locator(
            '[role="dialog"][data-scope="popover"][data-state="open"]',
        );

        await expect(popoverBody).toBeVisible();

        const actionButtons = popoverBody.getByRole("button", {
            name: /markAs(Read|Unread)/i,
        });

        await expect(actionButtons).toHaveCount(2);

        const firstNotification = popoverBody
            .locator("div")
            .filter({ hasText: "TN1" })
            .first();

        const secondNotification = popoverBody
            .locator("div")
            .filter({ hasText: "TN2" })
            .first();

        await expect(firstNotification.getByText("T1")).toBeVisible();
        await expect(firstNotification.getByText("TN1")).toBeVisible();
        await expect(
            firstNotification.getByRole("button", {
                name: /markAsRead/i,
            }),
        ).toBeVisible();

        await expect(secondNotification.getByText("T2")).toBeVisible();
        await expect(secondNotification.getByText("TN2")).toBeVisible();
        await expect(
            secondNotification.getByRole("button", {
                name: /markAsUnread/i,
            }),
        ).toBeVisible();
    });

    test("should update the read status of a notification when the mark as read/unread button is clicked", async ({
        page,
    }) => {
        const bellTrigger = page.getByRole("button", {
            name: /notifications/i,
        });

        const badge = bellTrigger.locator("xpath=following-sibling::div");

        await bellTrigger.click();

        const popoverBody = page.locator(
            '[role="dialog"][data-scope="popover"][data-state="open"]',
        );

        const tn1Text = popoverBody.getByText("TN1");
        const notificationContainer = tn1Text.locator("..");

        const markAsReadButton = notificationContainer.getByRole("button", {
            name: /markAsRead/i,
        });

        await markAsReadButton.click();

        await expect(
            notificationContainer.getByRole("button", {
                name: /markAsUnread/i,
            }),
        ).toBeVisible();

        await expect(badge).toBeHidden();
    });
});
