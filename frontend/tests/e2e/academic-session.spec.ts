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
        const dashboardCard = page
            .locator('a[href="/admin/academic-years"]')
            .filter({ hasText: /Konfigurasi semester dan tahun/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/academic-years/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        // Create session
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        await openCreateModalButton.click();

        const dialog = page.getByRole("dialog", {
            name: /daftar tahun ajaran baru|new academic session/i,
        });

        await expect(dialog).toBeVisible();

        const sessionInput = dialog.locator('input[name="session"]');
        await sessionInput.fill(testSession);

        await dialog
            .locator('select[name="semester"]')
            .selectOption(testSemester);

        await dialog.locator('input[name="startTime"]').fill(startDate);
        await dialog.locator('input[name="endTime"]').fill(endDate);

        const createSessionResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "POST" &&
                response.ok() &&
                /\/sessions\/?$/.test(new URL(response.url()).pathname),
        );

        const [createResponse] = await Promise.all([
            createSessionResponse,
            dialog.getByRole("button", { name: /buat|create/i }).click(),
        ]);

        expect(createResponse.ok()).toBe(true);

        const successToast = page.getByText(/berhasil|success/i).first();

        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // Search session
        const searchInput = page.locator('input[name="search"]');

        const searchSessionsResponse = page.waitForResponse((response) => {
            const url = response.url();

            return (
                response.request().method() === "GET" &&
                response.ok() &&
                url.includes("/sessions/list") &&
                url.includes("query=")
            );
        });

        await searchInput.fill(testSession);
        await searchSessionsResponse;

        const sessionRow = page.getByRole("row", {
            name: new RegExp(testSession),
        });

        await expect(sessionRow).toBeVisible();

        // Edit session
        const editLink = sessionRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.focus();

        await Promise.all([
            page.waitForURL(
                /\/admin\/academic-years\/edit\?session=2035%2F2036&semester=1/,
            ),
            page.keyboard.press("Enter"),
        ]);

        const editStartInput = page.locator('input[name="startTime"]');
        await expect(editStartInput).toBeVisible();

        await editStartInput.fill(updatedStartDate);

        const updateButton = page.getByRole("button", {
            name: /perbarui|update/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();
        await expect(page).toHaveURL(/\/admin\/academic-years/);
        await expect(updateToast).toBeHidden();

        // Delete session
        const searchUpdatedSessionsResponse = page.waitForResponse(
            (response) => {
                const url = response.url();

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.includes("/sessions/list") &&
                    url.includes("query=")
                );
            },
        );

        await searchInput.fill(testSession);
        await searchUpdatedSessionsResponse;

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

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        const clearSearchResponse = page.waitForResponse(
            (response) =>
                response.request().method() === "GET" &&
                response.ok() &&
                response.url().includes("/sessions/list"),
        );

        await searchInput.clear();
        await clearSearchResponse;

        await expect(
            page.getByRole("row", { name: new RegExp(testSession) }),
        ).toHaveCount(0);
    });
});
