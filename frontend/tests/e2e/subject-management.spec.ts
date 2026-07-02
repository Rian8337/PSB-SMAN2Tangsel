import { Subject } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Subject Management", () => {
    // Generate a unique suffix to ensure no collision with existing seeded data or parallel test runs.
    const uniqueSuffix = Date.now().toString().slice(-4);

    const createCode = `E2EC-${uniqueSuffix}`;
    const editSubject: Subject = {
        id: 0,
        code: `E2EE-${uniqueSuffix}`,
        name: `Mata Pelajaran E2E Edit ${uniqueSuffix}`,
        active: true,
    };
    const deleteSubject: Subject = {
        id: 0,
        code: `E2ED-${uniqueSuffix}`,
        name: `Mata Pelajaran E2E Delete ${uniqueSuffix}`,
        active: true,
    };

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        await seeders.subjects.seedMany(
            { code: editSubject.code, name: editSubject.name, active: true },
            {
                code: deleteSubject.code,
                name: deleteSubject.name,
                active: true,
            },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        // Clean up regardless of whether an individual test already removed its own subject via the UI, since
        // `subject` is a primary table and cannot be bulk-cleaned without also wiping shared worker data (e.g. users).
        await Promise.all([
            seeders.subjects.deleteWhere({ code: createCode }),
            seeders.subjects.deleteWhere({ code: editSubject.code }),
            seeders.subjects.deleteWhere({ code: deleteSubject.code }),
        ]);
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);

        const dashboardCard = page
            .locator('a[href="/admin/subjects"]')
            .filter({ hasText: /Kelola daftar mata pelajaran/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/subjects/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
    });

    test("should allow creating a subject", async ({ page }) => {
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        const dialog = page.getByRole("dialog", {
            name: /daftar mata pelajaran baru|new subject/i,
        });

        await expect(async () => {
            await openCreateModalButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const codeInput = dialog.locator('input[name="code"]');
        const nameInput = dialog.locator('input[name="name"]');

        const testName = `Mata Pelajaran E2E Create ${uniqueSuffix}`;

        await codeInput.fill(createCode);
        await nameInput.fill(testName);

        const createSubjectResponse = page.waitForResponse((response) => {
            const pathname = new URL(response.url()).pathname;

            return (
                response.request().method() === "POST" &&
                response.ok() &&
                /\/subjects\/?$/.test(pathname)
            );
        });

        await Promise.all([
            createSubjectResponse,
            dialog.getByRole("button", { name: /buat|create/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        const searchInput = page.locator('input[name="search"]');

        const searchSubjectsResponse = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                url.includes("/subjects/list") &&
                url.includes("query=")
            );
        });

        await searchInput.fill(createCode);
        await searchSubjectsResponse;

        const subjectRow = page.getByRole("row", {
            name: new RegExp(createCode, "i"),
        });

        await expect(subjectRow).toBeVisible();
        await expect(subjectRow).toContainText(testName);
    });

    test("should allow editing a subject", async ({ page }) => {
        const searchInput = page.locator('input[name="search"]');

        const searchSubjectsResponse = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                url.includes("/subjects/list") &&
                url.includes("query=")
            );
        });

        await searchInput.fill(editSubject.code);
        await searchSubjectsResponse;

        const subjectRow = page.getByRole("row", {
            name: new RegExp(editSubject.code, "i"),
        });

        await expect(subjectRow).toBeVisible();

        const editLink = subjectRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.focus();

        await Promise.all([
            page.waitForURL(/\/admin\/subjects\/\d+/),
            page.keyboard.press("Enter"),
        ]);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        const updatedName = `${editSubject.name} Updated`;
        await editNameInput.fill(updatedName);

        const activeSwitch = page.getByRole("checkbox");
        await activeSwitch.click({ force: true });

        const updateButton = page.getByRole("button", {
            name: /simpan|save/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/subjects/);
        await expect(updateToast).toBeHidden();

        const searchUpdatedSubjectsResponse = page.waitForResponse(
            (response) => {
                const url = response.url();

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.includes("/subjects/list") &&
                    url.includes("query=")
                );
            },
        );

        await searchInput.fill(updatedName);
        await searchUpdatedSubjectsResponse;

        const updatedRow = page.getByRole("row", {
            name: new RegExp(editSubject.code, "i"),
        });

        await expect(updatedRow).toBeVisible();
        await expect(updatedRow).toContainText(updatedName);
    });

    test("should allow deleting a subject", async ({ page }) => {
        const searchInput = page.locator('input[name="search"]');

        const searchSubjectsResponse = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                url.includes("/subjects/list") &&
                url.includes("query=")
            );
        });

        await searchInput.fill(deleteSubject.code);
        await searchSubjectsResponse;

        const subjectRow = page.getByRole("row", {
            name: new RegExp(deleteSubject.code, "i"),
        });

        await expect(subjectRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(deleteSubject.code);
            await confirmDialog.accept();
        });

        const deleteButton = subjectRow.getByRole("button", {
            name: new RegExp(`delete-${deleteSubject.code}`, "i"),
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(subjectRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        // Search is still applied, so no subjects should be found
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
