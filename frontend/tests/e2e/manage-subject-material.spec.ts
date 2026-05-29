import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginStudent, loginTeacher } from "./utils/login";

test.describe("Manage Subject Material Flow", () => {
    const subject = seededPrimaryData.subjects[0];
    const session = seededPrimaryData.sessions[0];

    const teacher = seededPrimaryData.users.find(
        (u) => u.role === UserRole.teacher,
    )!;

    const student = seededPrimaryData.users.find(
        (u) => u.role === UserRole.student,
    )!;

    let classSubjectId: number;
    let editMaterialId: number;
    let deleteMaterialId: number;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const cls = await seeders.classes.seedOne({
            name: "X-IPA-UC10",
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

        const [editMaterial, deleteMaterial] = await seeders.materials.seedMany(
            {
                classSubjectId,
                title: "Materi untuk Diedit",
                description: "Deskripsi awal",
                visible: false,
            },
            {
                classSubjectId,
                title: "Materi untuk Dihapus",
                visible: false,
            },
        );

        editMaterialId = editMaterial.id!;
        deleteMaterialId = deleteMaterial.id!;
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("Teacher dashboard should have Add Material button that navigates to create page", async ({
        page,
    }) => {
        await loginTeacher(page);

        await page.goto(`/id/subjects/${classSubjectId.toString()}`);

        await expect(
            page.getByRole("heading", { name: subject.name }),
        ).toBeVisible({ timeout: 10000 });

        // Use the retry pattern to handle pre-hydration clicks.
        await expect(async () => {
            await page
                .getByRole("button", { name: /tambah/i })
                .first()
                .click();

            await expect(page).toHaveURL(new RegExp(`/materials/create`), {
                timeout: 3000,
            });
        }).toPass({ timeout: 15000 });
    });

    test("Teacher should be able to create a material", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/materials/create`,
        );

        await expect(page.locator('input[name="title"]')).toBeVisible({
            timeout: 10000,
        });

        // Use the retry pattern to handle pre-hydration clicks.
        await expect(async () => {
            await page.locator('input[name="title"]').clear();
            await page.locator('input[name="title"]').fill("Materi Baru E2E");

            await page.getByRole("button", { name: /buat|create/i }).click();

            await expect(page).toHaveURL(
                new RegExp(`/subjects/${classSubjectId.toString()}$`),
                { timeout: 3000 },
            );
        }).toPass({ timeout: 15000 });

        await expect(page.getByText("Materi Baru E2E")).toBeVisible();
    });

    test("Teacher should be able to edit a material", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/materials/${editMaterialId.toString()}/edit`,
        );

        const titleInput = page.locator('input[name="title"]');

        await expect(titleInput).toBeVisible({ timeout: 10000 });

        await expect(titleInput).toHaveValue("Materi untuk Diedit", {
            timeout: 10000,
        });

        await titleInput.clear();
        await titleInput.fill("Materi Telah Diperbarui");

        await page.getByRole("button", { name: /simpan|save/i }).click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
            { timeout: 10000 },
        );

        await expect(page.getByText("Materi Telah Diperbarui")).toBeVisible();
    });

    test("Teacher should be able to toggle material visibility", async ({
        page,
    }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/materials/${editMaterialId.toString()}`,
        );

        await expect(
            page.getByRole("button", { name: /tampilkan ke siswa/i }),
        ).toBeVisible({ timeout: 10000 });

        await page.getByRole("button", { name: /tampilkan ke siswa/i }).click();

        await expect(
            page.getByRole("button", { name: /sembunyikan dari siswa/i }),
        ).toBeVisible({ timeout: 10000 });
    });

    test("Teacher should be able to delete a material", async ({ page }) => {
        await loginTeacher(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/materials/${deleteMaterialId.toString()}`,
        );

        await expect(
            page.getByRole("heading", { name: "Materi untuk Dihapus" }),
        ).toBeVisible({ timeout: 10000 });

        page.once("dialog", (dialog) => dialog.accept());

        await page.getByRole("button", { name: /hapus/i }).click();

        await expect(page).toHaveURL(
            new RegExp(`/subjects/${classSubjectId.toString()}$`),
            { timeout: 10000 },
        );

        await expect(page.getByText("Materi untuk Dihapus")).toBeHidden();
    });

    test("Student should see a 404 page when accessing the create material page", async ({
        page,
    }) => {
        await loginStudent(page);

        await page.goto(
            `/id/subjects/${classSubjectId.toString()}/materials/create`,
        );

        // notFound() renders a 404 at the same URL. Verify that the form is not present.
        await expect(page.locator('input[name="title"]')).toHaveCount(0, {
            timeout: 10000,
        });
    });
});
