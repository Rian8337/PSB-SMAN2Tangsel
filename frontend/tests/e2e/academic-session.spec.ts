import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Academic Session Management", () => {
    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the academic session management flow", async ({
        page,
    }) => {
        const testSession = "2035/2036";
        const testSemester = "1";
        const startDate = "2035-01-01";
        const endDate = "2035-06-01";
        const updatedStartDate = "2035-02-01";

        // Navigate
        // There are two links to the academic session management page, one in the sidebar and one in the dashboard. We just need to click one of them.
        await page.locator('a[href="/admin/academic-year"]').first().click();

        await expect(page).toHaveURL(/\/admin\/academic-year/);
        await expect(page.locator("table")).toBeVisible();

        // Create session
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        await openCreateModalButton.click();

        const dialog = page.locator('[role="dialog"][data-state="open"]');
        await expect(dialog).toBeVisible();

        const sessionInput = dialog.locator('input[name="session"]');
        await sessionInput.clear();
        await sessionInput.pressSequentially(testSession);

        await dialog
            .locator('select[name="semester"]')
            .selectOption(testSemester);

        await dialog.locator('input[name="startTime"]').fill(startDate);
        await dialog.locator('input[name="endTime"]').fill(endDate);

        await dialog.getByRole("button", { name: /buat|create/i }).click();

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(dialog).not.toBeAttached();
        await expect(successToast).toBeHidden();

        // Search session
        const searchInput = page.locator('input[name="search"]');

        await searchInput.click();
        await searchInput.pressSequentially(testSession, { delay: 50 });

        const sessionRow = page.getByRole("row", {
            name: new RegExp(testSession),
        });

        await expect(sessionRow).toBeVisible();

        // Edit session
        await sessionRow.getByRole("link", { name: /edit/i }).click();

        await expect(page).toHaveURL(
            /\/admin\/academic-year\/edit\?session=2035%2F2036&semester=1/,
        );

        const editStartInput = page.locator('input[name="startTime"]');
        await expect(editStartInput).toBeVisible();

        await editStartInput.fill(updatedStartDate);

        const updateButton = page.getByRole("button", {
            name: /perbarui|update/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/academic-year/);
        await expect(updateToast).toBeHidden();

        // Delete session
        await searchInput.clear();
        await searchInput.click();
        await searchInput.pressSequentially(testSession, { delay: 50 });

        const updatedRow = page.getByRole("row", {
            name: new RegExp(testSession),
        });
        await expect(updatedRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(testSession);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: `delete-${testSession}-semester-${testSemester}`,
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).first();
        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        await searchInput.clear();
        await page.waitForTimeout(500);

        await expect(
            page.getByRole("row", { name: new RegExp(testSession) }),
        ).toHaveCount(0);
    });
});
