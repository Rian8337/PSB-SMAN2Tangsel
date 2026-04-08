import { Subject } from "@psb/shared/types";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Subject Management", () => {
    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the subject management flow", async ({ page }) => {
        // Generate a unique code to ensure no collision with existing seeded data.
        const uniqueSuffix = Date.now().toString().slice(-4);

        const testSubject: Subject = {
            id: 0,
            code: `E2E-${uniqueSuffix}`,
            name: `Mata Pelajaran E2E ${uniqueSuffix}`,
            active: true,
        };

        // Navigate
        // There are two links to the subject management page, one in the sidebar and one in the dashboard. We just need to click one of them.
        await page.locator('a[href="/admin/subjects"]').first().click();

        await expect(page).toHaveURL(/\/admin\/subjects/);
        await expect(page.locator("table")).toBeVisible();

        // Create subject
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        const dialog = page.locator('[role="dialog"][data-state="open"]');

        await expect(async () => {
            await openCreateModalButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const codeInput = dialog.locator('input[name="code"]');
        const nameInput = dialog.locator('input[name="name"]');

        await codeInput.click();
        await codeInput.pressSequentially(testSubject.code);

        await nameInput.click();
        await nameInput.pressSequentially(testSubject.name);

        await dialog.getByRole("button", { name: /buat|create/i }).click();

        const successToast = page.getByText(/berhasil|success/i).first();
        await expect(successToast).toBeVisible();
        await expect(dialog).toBeHidden();

        // Wait for the toast to hide.
        await expect(successToast).toBeHidden();

        // Search subject
        const searchInput = page.locator('input[name="search"]');

        await searchInput.click();
        await searchInput.pressSequentially(testSubject.code, { delay: 50 });

        const subjectRow = page.getByRole("row", {
            name: new RegExp(testSubject.code, "i"),
        });

        await expect(subjectRow).toBeVisible();
        await expect(subjectRow).toContainText(testSubject.name);

        // Edit subject
        await subjectRow.getByRole("link", { name: /edit/i }).click();
        await expect(page).toHaveURL(/\/admin\/subjects\/\d+/);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        const updatedName = `${testSubject.name} Updated`;

        await editNameInput.clear();
        await editNameInput.click();
        await editNameInput.pressSequentially(updatedName);

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

        // Delete subject
        await searchInput.clear();
        await searchInput.click();
        await searchInput.pressSequentially(updatedName, { delay: 50 });

        const updatedRow = page.getByRole("row", {
            name: new RegExp(testSubject.code, "i"),
        });

        await expect(updatedRow).toBeVisible();
        await expect(updatedRow).toContainText(updatedName);

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(testSubject.code);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: new RegExp(`delete-${testSubject.code}`, "i"),
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();
        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();

        // Search is still applied, so no subjects should be found
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
