import { seededPrimaryData } from "@psb/shared/tests";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";
import { UserRole } from "@psb/shared/types";

test.describe("Class Student Management", () => {
    let targetStudentName: string;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;
        const session = seededPrimaryData.sessions[0];

        await seeders.classes.seedOne({
            name: "Test Class Student E2E",
            session: session.session,
            semester: session.semester,
        });

        // Grab a seeded student to test with
        const student = seededPrimaryData.users.find(
            (u) => u.role === UserRole.student,
        )!;
        targetStudentName = student.name;
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test("should complete the class student enrollment flow", async ({
        page,
    }) => {
        // Navigate to page
        const dashboardCard = page
            .locator('a[href="/admin/classes"]')
            .filter({ hasText: /Atur ruang kelas untuk/i });

        await dashboardCard.click();
        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        const targetClassRow = page
            .locator("tbody tr")
            .filter({ hasText: "Test Class Student E2E" })
            .first();

        const manageStudentsLink = targetClassRow.locator(
            'a[aria-label^="manage-students-"]',
        );

        await manageStudentsLink.click();

        await expect(page).toHaveURL(/\/admin\/classes\/\d+\/students/);
        await expect(page.locator("table")).toBeVisible();

        // Enroll student
        const openAssignModalButton = page.getByRole("button", {
            name: /enroll|tambah/i,
        });

        await openAssignModalButton.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const studentInput = dialog.locator("input").first();
        await studentInput.fill(targetStudentName);

        const studentOption = dialog
            .locator("li")
            .filter({ hasText: new RegExp(targetStudentName, "i") })
            .first();

        await expect(studentOption).toBeVisible();
        await studentOption.click();
        await expect(studentOption).toBeHidden();

        const enrollPromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "POST" &&
                url.includes("/classes/") &&
                url.includes("/students")
            );
        });

        const submitButton = dialog.getByRole("button", {
            name: /enroll|tambah/i,
        });

        const [enrollResponse] = await Promise.all([
            enrollPromise,
            submitButton.click(),
        ]);

        expect(enrollResponse.ok()).toBe(true);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect(successToast).toBeHidden({ timeout: 10000 });

        // Search enrolled student
        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    url.pathname.includes("/students") &&
                    url.searchParams.get("query") === targetStudentName
                );
            } catch {
                return false;
            }
        });

        await searchInput.fill(targetStudentName);

        const searchAssignedResponse = await searchAssignedPromise;
        expect(searchAssignedResponse.ok()).toBe(true);

        // Verify the newly enrolled student row exists.
        const studentRow = page
            .locator("tbody tr")
            .filter({ hasText: new RegExp(targetStudentName, "i") })
            .first();

        await expect(studentRow).toBeVisible();

        // Unenroll student
        page.once("dialog", async (confirmDialog) => {
            await confirmDialog.accept();
        });

        const deleteButton = studentRow.locator(
            'button[aria-label^="remove-student-"]',
        );

        const deletePromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "DELETE" &&
                url.includes("/classes/") &&
                url.includes("/students")
            );
        });

        const [deleteResponse] = await Promise.all([
            deletePromise,
            deleteButton.click(),
        ]);

        expect(deleteResponse.ok()).toBe(true);

        const deleteToast = page.getByText(/berhasil|success/i).last();
        await expect(deleteToast).toBeVisible();
        await expect(studentRow).toBeHidden();
        await expect(deleteToast).toBeHidden({ timeout: 10000 });

        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
