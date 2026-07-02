import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Academic Session Management", () => {
    const createSession = "2036/2037";
    const editSession = "2037/2038";
    const deleteSession = "2038/2039";
    const testSemester = "1";

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        await seeders.sessions.seedMany(
            {
                session: editSession,
                semester: 1,
                startTime: new Date("2037-01-01"),
                endTime: new Date("2037-06-01"),
            },
            {
                session: deleteSession,
                semester: 1,
                startTime: new Date("2038-01-01"),
                endTime: new Date("2038-06-01"),
            },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        // Clean up regardless of whether an individual test already removed its own session via the UI, since
        // `session` is a primary table and cannot be bulk-cleaned without also wiping shared worker data (e.g. users).
        await Promise.all([
            seeders.sessions.deleteWhere({ session: createSession, semester: 1 }),
            seeders.sessions.deleteWhere({ session: editSession, semester: 1 }),
            seeders.sessions.deleteWhere({ session: deleteSession, semester: 1 }),
        ]);
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);

        const dashboardCard = page
            .locator('a[href="/admin/academic-years"]')
            .filter({ hasText: /Konfigurasi semester dan tahun/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/academic-years/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
    });

    test("should allow creating an academic session", async ({ page }) => {
        const startDate = "2036-01-01";
        const endDate = "2036-06-01";

        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        await openCreateModalButton.click();

        const dialog = page.getByRole("dialog", {
            name: /daftar tahun ajaran baru|new academic session/i,
        });

        await expect(dialog).toBeVisible();

        const sessionInput = dialog.locator('input[name="session"]');
        await sessionInput.fill(createSession);

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

        await searchInput.fill(createSession);
        await searchSessionsResponse;

        const sessionRow = page.getByRole("row", {
            name: new RegExp(createSession),
        });

        await expect(sessionRow).toBeVisible();
    });

    test("should allow editing an academic session", async ({ page }) => {
        const updatedStartDate = "2037-02-01";

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

        await searchInput.fill(editSession);
        await searchSessionsResponse;

        const sessionRow = page.getByRole("row", {
            name: new RegExp(editSession),
        });

        await expect(sessionRow).toBeVisible();

        const editLink = sessionRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.focus();

        await Promise.all([
            page.waitForURL(
                new RegExp(
                    `/admin/academic-years/edit\\?session=${encodeURIComponent(editSession)}&semester=1`,
                ),
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

        await searchInput.fill(editSession);
        await searchUpdatedSessionsResponse;

        const updatedRow = page.getByRole("row", {
            name: new RegExp(editSession),
        });

        await expect(updatedRow).toBeVisible();
    });

    test("should allow deleting an academic session", async ({ page }) => {
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

        await searchInput.fill(deleteSession);
        await searchSessionsResponse;

        const sessionRow = page.getByRole("row", {
            name: new RegExp(deleteSession),
        });
        await expect(sessionRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(deleteSession);
            await confirmDialog.accept();
        });

        const deleteButton = sessionRow.getByRole("button", {
            name: `delete-${deleteSession}-semester-${testSemester}`,
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(sessionRow).toBeHidden();
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
            page.getByRole("row", { name: new RegExp(deleteSession) }),
        ).toHaveCount(0);
    });
});
