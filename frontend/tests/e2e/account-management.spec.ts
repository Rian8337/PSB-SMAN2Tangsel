import { Student, UserRole } from "@psb/shared/types";
import { expect, test } from "./fixtures";
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

        const dialog = page.locator('[role="dialog"][data-state="open"]');

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
        await searchInput.pressSequentially(registeredUser.name, { delay: 50 });

        const userRow = page.getByRole("row", { name: registeredUser.name });

        await expect(userRow).toBeVisible();
        await expect(userRow).toContainText(registeredUser.identifier);

        // Edit user
        await userRow.getByRole("link", { name: /edit/i }).click();
        await expect(page).toHaveURL(/\/admin\/users\/\d+/);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        const updatedName = `${registeredUser.name} Updated`;

        await editNameInput.clear();
        await editNameInput.click();
        await editNameInput.pressSequentially(updatedName);

        const activeSwitch = page.getByRole("checkbox");
        await activeSwitch.click({ force: true });

        const updateButton = page.getByRole("button", {
            name: /update|perbarui/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(updateToast).toBeHidden();

        // Delete user
        await searchInput.clear();
        await searchInput.click();
        await searchInput.pressSequentially(updatedName, { delay: 50 });

        const updatedRow = page.getByRole("row", { name: updatedName });
        await expect(updatedRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(updatedName);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: `delete-${registeredUser.identifier}`,
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();

        // Search is still applied, so no users should be found
        await expect(page.locator("table")).toContainText(
            /tidak ada pengguna|no users found/i,
        );
    });
});
