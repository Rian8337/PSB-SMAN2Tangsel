import { expect, test } from "@playwright/test";
import { Student, UserRole } from "@psb/shared/types";
import { loginAdministrator } from "./utils/login";

test.describe("Account Management", () => {
    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the account management flow", async ({ page }) => {
        const registeredUser: Student = {
            active: true,
            id: 0,
            identifier: `99999${Date.now().toString().slice(-5)}`,
            name: `End to End Test User`,
            password: "StrongPassword!23",
            role: UserRole.student,
            userId: 0,
        };

        // Navigate
        // There are two links to the account management page, one in the sidebar and one in the dashboard. We just need to click one of them.
        await page.locator('a[href="/admin/users"]').first().click();

        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.locator("table")).toBeVisible();

        // Create user
        const openCreateUserDialogButton = page.getByRole("button", {
            name: /daftar|register/i,
        });

        const dialog = page.getByRole("dialog");

        await expect(async () => {
            await openCreateUserDialogButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const nameInput = dialog.locator('input[name="name"]');
        const identifierInput = dialog.locator('input[name="identifier"]');
        const roleSelect = dialog.locator('select[name="role"]');
        const passwordInput = dialog.locator('input[name="password"]');

        await nameInput.click();
        await nameInput.pressSequentially(registeredUser.name);

        await identifierInput.click();
        await identifierInput.pressSequentially(registeredUser.identifier);

        await roleSelect.selectOption(UserRole.student.toString());

        await passwordInput.click();
        await passwordInput.pressSequentially(registeredUser.password);

        await dialog.getByRole("button", { name: /buat|create/i }).click();

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(dialog).toBeHidden();

        // Wait for the toast to hide.
        await expect(successToast).toBeHidden();

        // Search user
        const searchInput = page.locator('input[name="search"]');

        await searchInput.click();
        await searchInput.pressSequentially(registeredUser.name);

        const userRow = page.getByRole("row", { name: registeredUser.name });

        await expect(userRow).toBeVisible();
        await expect(userRow).toContainText(registeredUser.identifier);

        // Delete user
        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(registeredUser.name);

            await confirmDialog.accept();
        });

        const deleteButton = userRow.getByRole("button", {
            name: `delete-${registeredUser.identifier}`,
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(userRow).toBeHidden();

        // Search is still applied, so no users should be found
        await expect(page.locator("table")).toContainText(
            /tidak ada pengguna|no users found/i,
        );
    });
});
