import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("Manage Assignment Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.teacher,
    )!;

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.student,
    )!;

    let classSubjectId: number;
    let editAssignmentId: number;
    let deleteAssignmentId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "X-IPA-UC13",
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

        const [editAssignment, deleteAssignment] =
            await seeders.assignments.seedMany(
                {
                    classSubjectId,
                    title: "Tugas untuk Diedit",
                    description: "Deskripsi awal",
                    visible: false,
                },
                {
                    classSubjectId,
                    title: "Tugas untuk Dihapus",
                    visible: false,
                },
            );

        editAssignmentId = editAssignment.id!;
        deleteAssignmentId = deleteAssignment.id!;
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Teacher dashboard should have Add Assignment button that navigates to create page", async ({
        page,
    }) => {
        await loginTeacher(page);

        await page.goto(`/id/subjects/${classSubjectId.toString()}`);

        await expect(
            page.getByRole("heading", { name: subject.name }),
        ).toBeVisible({ timeout: 10000 });

        await expect(async () => {
            await page
                .getByRole("button", { name: /tambah/i })
                .last()
                .click();

            await expect(page).toHaveURL(new RegExp(`/assignments/create`), {
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });
    });

    test("Teacher should be able to create an assignment", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/assignments/create`,
        );

        await expect(page.locator('input[name="title"]')).toBeVisible({
            timeout: 10000,
        });

        // Use the retry pattern to handle pre-hydration clicks.
        await expect(async () => {
            await page.locator('input[name="title"]').clear();
            await page.locator('input[name="title"]').fill("Tugas Baru E2E");

            await page.getByRole("button", { name: /buat|create/i }).click();

            await expect(page).toHaveURL(
                new RegExp(`/subjects/${classSubjectId.toString()}$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });

        await expect(page.getByText("Tugas Baru E2E")).toBeVisible();
    });

    test("Teacher should be able to edit an assignment", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/assignments/${editAssignmentId.toString()}/edit`,
        );

        const titleInput = page.locator('input[name="title"]');

        await expect(titleInput).toBeVisible({ timeout: 10000 });

        await expect(titleInput).toHaveValue("Tugas untuk Diedit", {
            timeout: 10000,
        });

        await titleInput.clear();
        await titleInput.fill("Tugas Telah Diperbarui");

        await page.getByRole("button", { name: /simpan|save/i }).click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
            { timeout: 10000 },
        );

        await expect(page.getByText("Tugas Telah Diperbarui")).toBeVisible();
    });

    test("Teacher should be able to toggle assignment visibility", async ({
        page,
    }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/assignments/${editAssignmentId.toString()}`,
        );

        await expect(
            page.getByRole("button", { name: /tampilkan ke siswa/i }),
        ).toBeVisible({ timeout: 10000 });

        await page
            .getByRole("button", { name: /tampilkan ke siswa/i })
            .click();

        await expect(
            page.getByRole("button", { name: /sembunyikan dari siswa/i }),
        ).toBeVisible({ timeout: 10000 });
    });

    test("Teacher should be able to delete an assignment", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/assignments/${deleteAssignmentId.toString()}`,
        );

        await expect(
            page.getByRole("heading", { name: "Tugas untuk Dihapus" }),
        ).toBeVisible({ timeout: 10000 });

        page.once("dialog", (dialog) => dialog.accept());

        await page.getByRole("button", { name: /hapus/i }).click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
            { timeout: 10000 },
        );

        await expect(page.getByText("Tugas untuk Dihapus")).toBeHidden();
    });

    test("Student should see a 404 page when accessing the create assignment page", async ({
        page,
    }) => {
        await loginStudent(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/assignments/create`,
        );

        await expect(page.locator('input[name="title"]')).toHaveCount(0, {
            timeout: 10000,
        });
    });
});
