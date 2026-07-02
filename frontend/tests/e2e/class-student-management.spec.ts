import { Page } from "@playwright/test";
import { seededPrimaryData, testPasswordHash } from "@psb/shared/tests";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";
import { UserRole } from "@psb/shared/types";

test.describe("Class Student Management", () => {
    const session = seededPrimaryData.sessions[0];
    const uniqueSuffix = Date.now().toString().slice(-4);

    const enrollClassName = `Test Class Enroll E2E ${uniqueSuffix}`;
    const unenrollClassName = `Test Class Unenroll E2E ${uniqueSuffix}`;

    // The seeded active student can only belong to one class per session/semester, so the enroll
    // and unenroll scenarios each need their own student to avoid the seeded enrollment for one
    // test making that student unavailable in the other test's enrollment autocomplete.
    const enrollStudentName = seededPrimaryData.users.find(
        (u) => u.role === UserRole.student,
    )!.name;

    const unenrollStudentName = `Unenroll Target Student E2E ${uniqueSuffix}`;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const [, unenrollClass] = await seeders.classes.seedMany(
            {
                name: enrollClassName,
                session: session.session,
                semester: session.semester,
            },
            {
                name: unenrollClassName,
                session: session.session,
                semester: session.semester,
            },
        );

        const unenrollStudentUser = await seeders.users.seedOne({
            active: true,
            name: unenrollStudentName,
            password: testPasswordHash,
            role: UserRole.student,
            identifier: `9${uniqueSuffix}0`,
        });

        await seeders.students.seedOne({ userId: unenrollStudentUser.id! });

        await seeders.studentClasses.seedOne({
            classId: unenrollClass.id!,
            studentId: unenrollStudentUser.id!,
        });
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    async function navigateToClassStudents(page: Page, className: string) {
        const dashboardCard = page
            .locator('a[href="/admin/classes"]')
            .filter({ hasText: /Atur ruang kelas untuk/i });

        await dashboardCard.click();
        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        const classRow = page
            .locator("tbody tr")
            .filter({ hasText: className })
            .first();

        await expect(classRow).toBeVisible({ timeout: 15000 });

        const manageStudentsLink = classRow.locator(
            'a[aria-label^="manage-students-"]',
        );

        await manageStudentsLink.click();

        await expect(page).toHaveURL(/\/admin\/classes\/\d+\/students/);
        await expect(page.locator("table")).toBeVisible();
    }

    test("should allow enrolling a student in a class", async ({ page }) => {
        await navigateToClassStudents(page, enrollClassName);

        const openAssignModalButton = page.getByRole("button", {
            name: /enroll|tambah/i,
        });

        await openAssignModalButton.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const studentInput = dialog.locator("input").first();
        await studentInput.fill(enrollStudentName);

        const studentOption = dialog
            .locator("li")
            .filter({ hasText: new RegExp(enrollStudentName, "i") })
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

        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    url.pathname.includes("/students") &&
                    url.searchParams.get("query") === enrollStudentName
                );
            } catch {
                return false;
            }
        });

        await searchInput.fill(enrollStudentName);

        const searchAssignedResponse = await searchAssignedPromise;
        expect(searchAssignedResponse.ok()).toBe(true);

        const studentRow = page
            .locator("tbody tr")
            .filter({ hasText: new RegExp(enrollStudentName, "i") })
            .first();

        await expect(studentRow).toBeVisible();
    });

    test("should allow unenrolling a student from a class", async ({
        page,
    }) => {
        await navigateToClassStudents(page, unenrollClassName);

        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    url.pathname.includes("/students") &&
                    url.searchParams.get("query") === unenrollStudentName
                );
            } catch {
                return false;
            }
        });

        await searchInput.fill(unenrollStudentName);

        const searchAssignedResponse = await searchAssignedPromise;
        expect(searchAssignedResponse.ok()).toBe(true);

        const studentRow = page
            .locator("tbody tr")
            .filter({ hasText: new RegExp(unenrollStudentName, "i") })
            .first();

        await expect(studentRow).toBeVisible();

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
