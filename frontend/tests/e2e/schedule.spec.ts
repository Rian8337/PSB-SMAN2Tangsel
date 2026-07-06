import { seededPrimaryData } from "@psb/shared/tests";
import { ScheduleDay } from "@psb/shared/types";
import { encodeSessionCode } from "@psb/shared/utils";
import { expect, test } from "./fixtures";
import { loginStudent } from "./utils/login";

test.describe("Student Dashboard Schedule", () => {
    const student = seededPrimaryData.students[0];
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;
        const teacher = seededPrimaryData.teachers[0];

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
            day: ScheduleDay.Monday,
            startTime: new Date(2024, 0, 1, 8),
            endTime: new Date(2024, 0, 1, 9, 30),
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(`/id/${sessionCode}/schedule`);

            await expect(
                page.getByRole("button", { name: "Unduh Jadwal" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        // Drain any in-flight navigations from the schedule component's
        // fetch-on-mount cycle so the test body starts with a stable page.
        await page.waitForLoadState("networkidle");
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
