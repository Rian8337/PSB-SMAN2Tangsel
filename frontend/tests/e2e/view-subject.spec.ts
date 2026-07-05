import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("View Subject Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Student,
    )!;

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.Teacher,
    )!;

    let classSubjectId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "XI-IPA-1",
            session: session.session,
            semester: session.semester,
        });

        await seeders.studentClasses.seedOne({
            classId: cls.id!,
            studentId: student.id,
        });

        const classSubject = await seeders.classSubjects.seedOne({
            classId: cls.id!,
            subjectId: subject.id,
            teacherId: teacher.id,
        });

        classSubjectId = classSubject.id!;

        await seeders.materials.seedMany(
            { classSubjectId, title: "Visible Material", visible: true },
            { classSubjectId, title: "Hidden Material", visible: false },
        );

        await seeders.assignments.seedMany(
            { classSubjectId, title: "Visible Assignment", visible: true },
            { classSubjectId, title: "Hidden Assignment", visible: false },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Student should navigate to subject dashboard and only see visible content", async ({
        page,
    }) => {
        await loginStudent(page);

        await expect(async () => {
            await page.goto("/id/subjects");

            await expect(
                page.getByRole("row", { name: subject.code }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        const row = page.getByRole("row", { name: subject.code });
        await row.click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
        );

        // Visible content should appear first (also acts as page-loaded gate).
        await expect(
            page.getByRole("link", { name: "Visible Material" }),
        ).toBeVisible();

        await expect(
            page.getByRole("link", { name: "Visible Assignment" }),
        ).toBeVisible();

        // Hidden content should not be present for students.
        await expect(
            page.getByRole("link", { name: "Hidden Material" }),
        ).not.toBeVisible();
        await expect(
            page.getByRole("link", { name: "Hidden Assignment" }),
        ).not.toBeVisible();

        // Teacher-only "Tambah" (Add) buttons should not be present.
        await expect(page.getByRole("button", { name: /Tambah/i })).toHaveCount(
            0,
        );
    });

    test("Teacher should see all content including hidden items and add buttons", async ({
        page,
    }) => {
        await loginTeacher(page);

        await expect(async () => {
            await page.goto("/id/subjects");

            await expect(
                page.getByRole("row", { name: "XI-IPA-1" }),
            ).toBeVisible({ timeout: 3000 });
        }).toPass({ timeout: 15000 });

        const row = page.getByRole("row", { name: "XI-IPA-1" });
        await row.click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
        );

        // Both visible and hidden materials should appear for teachers.
        await expect(
            page.getByRole("link", { name: "Visible Material" }),
        ).toBeVisible();

        await expect(
            page.getByRole("link", { name: "Hidden Material" }),
        ).toBeVisible();

        // Both visible and hidden assignments should appear for teachers.
        await expect(
            page.getByRole("link", { name: "Visible Assignment" }),
        ).toBeVisible();

        await expect(
            page.getByRole("link", { name: "Hidden Assignment" }),
        ).toBeVisible();

        // Teacher-only "Tambah" (Add) buttons should be present for each section.
        await expect(page.getByRole("button", { name: /Tambah/i })).toHaveCount(
            2,
        );
    });
});
