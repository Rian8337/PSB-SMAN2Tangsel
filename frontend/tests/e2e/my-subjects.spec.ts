import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { encodeSessionCode } from "@/utils/sessionCode";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("My Subjects Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];
    const sessionCode = encodeSessionCode(session.session, session.semester);

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        // Setup for Student
        const studentClass = await seeders.classes.seedOne({
            name: "X-IPA-1",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: studentClass.id!,
            studentId: student.id,
        });

        await seeders.classSubjects.seedOne({
            classId: studentClass.id!,
            subjectId: subject.id,
            teacherId: teacher.id,
        });

        // Setup for Teacher (different class)
        const teacherClass = await seeders.classes.seedOne({
            name: "X-IPA-2",
            session: session.session,
            semester: session.semester,
        });

        await seeders.classSubjects.seedOne({
            classId: teacherClass.id!,
            subjectId: subject.id,
            teacherId: teacher.id,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student should be able to view their registered subjects", async ({
        page,
    }) => {
        await loginStudent(page);

        // Click on My Subjects card in Dashboard.
        await page.getByRole("link", { name: /Mata Pelajaran Saya/i }).click();

        await expect(page).toHaveURL(/.*\/subjects/);
        await expect(
            page.getByRole("heading", { name: "Mata Pelajaran Saya" }),
        ).toBeVisible();

        // Verify subject and teacher info.
        const row = page.getByRole("row", { name: subject.code });
        await expect(row.getByText(subject.name)).toBeVisible();
        await expect(row.getByText(teacher.name)).toBeVisible();
        await expect(row.getByText("X-IPA-1")).toBeVisible();
    });

    test("Teacher should be able to view their assigned subjects", async ({
        page,
    }) => {
        await loginTeacher(page);

        // Navigation from Dashboard.
        await page.getByRole("link", { name: /Mata Pelajaran Saya/i }).click();

        await expect(page).toHaveURL(/.*\/subjects/);

        // Verify subject and class info for teacher.
        const row = page.getByRole("row", { name: "X-IPA-2" });
        await expect(row.getByText(subject.code)).toBeVisible();
        await expect(row.getByText(subject.name)).toBeVisible();
    });

    test("User should be able to search subjects", async ({ page }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto(`/id/${sessionCode}/subjects`);

            await expect(
                page.getByPlaceholder("Cari mata pelajaran..."),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        const searchInput = page.getByPlaceholder("Cari mata pelajaran...");
        await searchInput.fill(subject.code);

        await expect(page.getByText(subject.name)).toBeVisible();

        await searchInput.fill("NON_EXISTENT_SUBJECT");
        await expect(
            page.getByText("Tidak ada mata pelajaran yang ditemukan."),
        ).toBeVisible();
    });
});
