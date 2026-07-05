import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";
import { UserRole } from "@psb/shared/types";

test.describe("Class Subject Management", () => {
    const session = seededPrimaryData.sessions[0];
    const uniqueSuffix = Date.now().toString().slice(-4);

    const assignClassName = `Test Class Assign E2E ${uniqueSuffix}`;
    const updateClassName = `Test Class Update Teacher E2E ${uniqueSuffix}`;
    const unassignClassName = `Test Class Unassign E2E ${uniqueSuffix}`;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        const [, updateClass, unassignClass] = await seeders.classes.seedMany(
            {
                name: assignClassName,
                session: session.session,
                semester: session.semester,
            },
            {
                name: updateClassName,
                session: session.session,
                semester: session.semester,
            },
            {
                name: unassignClassName,
                session: session.session,
                semester: session.semester,
            },
        );

        await seeders.classSubjects.seedMany(
            {
                classId: updateClass.id!,
                subjectId: seededPrimaryData.subjects[1].id,
            },
            {
                classId: unassignClass.id!,
                subjectId: seededPrimaryData.subjects[1].id,
            },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    async function navigateToClassSubjects(page: Page, className: string) {
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

        const manageSubjectsLink = classRow.locator(
            'a[aria-label^="manage-subjects-"]',
        );

        await manageSubjectsLink.click();

        await expect(page).toHaveURL(/\/admin\/classes\/\d+\/subjects/);
        await expect(page.locator("table")).toBeVisible();
    }

    test("should allow assigning a subject to a class", async ({ page }) => {
        await navigateToClassSubjects(page, assignClassName);

        // Target the button with the Plus icon.
        const openAssignModalButton = page
            .locator("button")
            .filter({ has: page.locator("svg.lucide-plus") });

        await openAssignModalButton.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const subjectInput = dialog.locator("input").first();
        await subjectInput.fill("MA2");

        const subjectOption = dialog
            .locator("li")
            .filter({ hasText: /MA2/i })
            .first();

        await expect(subjectOption).toBeVisible();
        await subjectOption.click();
        await expect(subjectOption).toBeHidden();

        // Leave teacher blank to test null flow.
        const assignSubjectPromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "POST" &&
                url.includes("/classes/") &&
                url.includes("/subjects")
            );
        });

        const submitButton = dialog.getByRole("button", {
            name: /tambah mata pelajaran|assign/i,
        });

        const [assignResponse] = await Promise.all([
            assignSubjectPromise,
            submitButton.click(),
        ]);

        expect(assignResponse.ok()).toBe(true);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(dialog).toBeHidden();
        await expect(successToast).toBeHidden({ timeout: 10000 });

        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                url.includes("/subjects") &&
                url.includes("query=MA2")
            );
        });

        await searchInput.fill("MA2");

        const searchAssignedResponse = await searchAssignedPromise;
        expect(searchAssignedResponse.ok()).toBe(true);

        const subjectRow = page
            .locator("tbody tr")
            .filter({ hasText: /MA2/i })
            .first();

        await expect(subjectRow).toBeVisible();
    });

    test("should allow updating the teacher of an assigned subject", async ({
        page,
    }) => {
        await navigateToClassSubjects(page, updateClassName);

        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                url.includes("/subjects") &&
                url.includes("query=MA2")
            );
        });

        await searchInput.fill("MA2");
        await searchAssignedPromise;

        const subjectRow = page
            .locator("tbody tr")
            .filter({ hasText: /MA2/i })
            .first();

        await expect(subjectRow).toBeVisible();

        const seededTeacher = seededPrimaryData.users.find(
            (u) => u.role === UserRole.Teacher,
        )!;

        const inlineTeacherInput = subjectRow.locator("input").first();
        await inlineTeacherInput.click();
        await inlineTeacherInput.fill(seededTeacher.name);

        const teacherOption = page
            .locator("li")
            .filter({ hasText: new RegExp(seededTeacher.name, "i") })
            .first();

        await expect(teacherOption).toBeVisible();

        const updatePromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "PATCH" &&
                url.includes("/classes/") &&
                url.includes("/subjects")
            );
        });

        const [updateResponse] = await Promise.all([
            updatePromise,
            teacherOption.click(),
        ]);

        expect(updateResponse.ok()).toBe(true);

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(updateToast).toBeHidden({ timeout: 10000 });

        // The committed value lives in the input's `value` attribute, not its text content.
        await expect(inlineTeacherInput).toHaveValue(seededTeacher.name);
    });

    test("should allow unassigning a subject from a class", async ({
        page,
    }) => {
        await navigateToClassSubjects(page, unassignClassName);

        const searchInput = page.locator('input[name="search"]');

        const searchAssignedPromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                url.includes("/subjects") &&
                url.includes("query=MA2")
            );
        });

        await searchInput.fill("MA2");
        await searchAssignedPromise;

        const subjectRow = page
            .locator("tbody tr")
            .filter({ hasText: /MA2/i })
            .first();

        await expect(subjectRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            await confirmDialog.accept();
        });

        const deleteButton = subjectRow.locator(
            'button[aria-label^="remove-subject-MA2"]',
        );

        const deletePromise = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "DELETE" &&
                url.includes("/classes/") &&
                url.includes("/subjects")
            );
        });

        const [deleteResponse] = await Promise.all([
            deletePromise,
            deleteButton.click(),
        ]);

        expect(deleteResponse.ok()).toBe(true);

        const deleteToast = page.getByText(/berhasil|success/i).last();
        await expect(deleteToast).toBeVisible();
        await expect(subjectRow).toBeHidden();
        await expect(deleteToast).toBeHidden({ timeout: 10000 });

        // Verify the table shows the empty state after deletion.
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
