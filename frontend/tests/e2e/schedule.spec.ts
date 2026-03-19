import { test, expect } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { seeders, testDbManager } from "./utils/db";

test.describe("Student Dashboard Schedule", () => {
    const student = seededPrimaryData.students[0];
    const subject = seededPrimaryData.subjects[0];

    test.beforeAll(async () => {
        const teacher = seededPrimaryData.teachers[0];
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
            teacherId: teacher.userId,
        });

        await seeders.schedules.seedOne({
            id: 1,
            classSubjectId: classSubject.id!,
            day: ScheduleDay.monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9, 30),
        });
    });

    test.afterAll(testDbManager.cleanupSecondaryTables);

    test.beforeEach(async ({ page }) => {
        await page.goto("/login");
        await page.fill('input[name="id"]', student.nisn);
        await page.fill('input[name="password"]', "password123");
        await page.click('button[type="submit"]');
        await page.waitForURL("**/dashboard");
    });

    test("should log in as a student and display the scheduled class", async ({
        page,
    }) => {
        const classBlock = page.getByText(subject.name);

        await expect(classBlock).toBeVisible();
        await expect(page.getByText("Senin").first()).toBeVisible();
    });

    test("should download the .ics schedule file", async ({ page }) => {
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: "Unduh Jadwal" }).click();

        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe("jadwal_pelajaran.ics");

        const failure = await download.failure();
        expect(failure).toBeNull();
    });
});
