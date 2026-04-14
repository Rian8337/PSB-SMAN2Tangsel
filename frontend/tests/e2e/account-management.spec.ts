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
        const dashboardCard = page
            .locator('a[href="/admin/users"]')
            .filter({ hasText: /Buat, edit, dan kelola/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        // Create user
        const openCreateUserDialogButton = page.getByRole("button", {
            name: /daftar|register/i,
        });

        const dialog = page.getByRole("dialog", {
            name: /daftar pengguna baru|register user/i,
        });

        await expect(async () => {
            await openCreateUserDialogButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const nameInput = dialog.locator('input[name="name"]');
        const identifierInput = dialog.locator('input[name="identifier"]');
        const roleSelect = dialog.locator('select[name="role"]');
        const passwordInput = dialog.locator('input[name="password"]');

        await nameInput.fill(registeredUser.name);
        await identifierInput.fill(registeredUser.identifier);
        await roleSelect.selectOption(UserRole.student.toString());
        await passwordInput.fill(registeredUser.password);

        const createUserResponse = page.waitForResponse((response) => {
            const pathname = new URL(response.url()).pathname;

            return (
                response.request().method() === "POST" &&
                response.ok() &&
                /\/users\/create\/?$/.test(pathname)
            );
        });

        await Promise.all([
            createUserResponse,
            dialog.getByRole("button", { name: /buat|create/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Animations are inconsistent across browsers. In WebKit, the dialog is hidden but still in the DOM
        // with data-state="closed". In Chromium/Firefox, it is unmounted from the DOM. Both are valid
        // implementations of hiding the dialog, so we check for both possibilities here.
        await expect(async () => {
            const count = await dialog.count();

            if (count > 0) {
                expect(await dialog.getAttribute("data-state")).toBe("closed");
            }
        }).toPass({ timeout: 5000 });

        // Search user
        const searchInput = page.locator('input[name="search"]');

        const searchUsersResponse = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.pathname.includes("/users/list") &&
                    url.searchParams.get("query") === registeredUser.name
                );
            } catch {
                return false;
            }
        });

        await searchInput.clear();
        await searchInput.fill(registeredUser.name);
        await searchUsersResponse;

        const userRow = page.getByRole("row", {
            name: new RegExp(
                `${registeredUser.name}.*${registeredUser.identifier}`,
            ),
        });

        await expect(userRow).toBeVisible();
        await expect(userRow).toContainText(registeredUser.identifier);

        // Edit user
        const editLink = userRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.focus();

        await Promise.all([
            page.waitForURL(/\/admin\/users\/\d+/),
            page.keyboard.press("Enter"),
        ]);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        const updatedName = `${registeredUser.name} Updated`;
        await editNameInput.fill(updatedName);

        const activeSwitch = page.getByRole("checkbox");
        await activeSwitch.click({ force: true });

        const updateButton = page.getByRole("button", {
            name: /update|perbarui/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(updateToast).toBeHidden({ timeout: 10000 });

        // Delete user
        const searchUpdatedUsersResponse = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.pathname.includes("/users/list") &&
                    url.searchParams.get("query") === updatedName
                );
            } catch {
                return false;
            }
        });

        await searchInput.clear();
        await searchInput.fill(updatedName);
        await searchUpdatedUsersResponse;

        const updatedRow = page.getByRole("row", { name: updatedName });
        await expect(updatedRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(updatedName);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: `delete-${registeredUser.identifier}`,
        });

        const deleteResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === "DELETE" &&
                response.ok() &&
                response.url().includes("/users/"),
        );

        await Promise.all([deleteResponsePromise, deleteButton.click()]);

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();
        await expect(deleteToast).toBeHidden({ timeout: 10000 });

        // Search is still applied, so no users should be found
        await expect(page.locator("table")).toContainText(
            /tidak ada pengguna|no users found/i,
        );
    });
});
