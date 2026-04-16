import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Class Management", () => {
    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);
    });

    test("should complete the class management flow", async ({ page }) => {
        // Generate a unique suffix to ensure no collision with seeded data or parallel test runs.
        const uniqueSuffix = Date.now().toString().slice(-4);
        const testClassName = `X E2E ${uniqueSuffix}`;
        const updatedClassName = `XI E2E ${uniqueSuffix} UP`;

        // Navigate
        const dashboardCard = page
            .locator('a[href="/admin/classes"]')
            .filter({ hasText: /Atur ruang kelas untuk/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

        // Create class
        const openCreateModalButton = page.getByRole("button", {
            name: /tambah|add/i,
        });

        const dialog = page.getByRole("dialog");

        await expect(async () => {
            await openCreateModalButton.click();
            await expect(dialog).toBeVisible();
        }).toPass({ timeout: 10000 });

        const nameInput = dialog.locator('input[name="name"]');
        await nameInput.fill(testClassName);

        const createClassResponse = page.waitForResponse((response) => {
            const pathname = new URL(response.url()).pathname;

            return (
                response.request().method() === "POST" &&
                response.ok() &&
                /\/classes\/?$/.test(pathname)
            );
        });

        await Promise.all([
            createClassResponse,
            dialog.getByRole("button", { name: /buat|create/i }).click(),
        ]);

        const successToast = page.getByText(/berhasil|success/i).first();
        await expect(successToast).toBeVisible();
        await expect(successToast).toBeHidden();

        // Animations are inconsistent across browsers. In WebKit, the dialog is hidden but still in the DOM
        // with data-state="closed". In Chromium/Firefox, it is unmounted from the DOM.
        await expect(async () => {
            const count = await dialog.count();

            if (count > 0) {
                expect(await dialog.getAttribute("data-state")).toBe("closed");
            }
        }).toPass({ timeout: 5000 });

        // Search class
        const searchInput = page.locator('input[name="search"]');

        const searchClassesResponse = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.pathname.includes("/classes") &&
                    url.searchParams.get("query") === testClassName
                );
            } catch {
                return false;
            }
        });

        await searchInput.clear();
        await searchInput.fill(testClassName);
        await searchClassesResponse;

        const classRow = page.getByRole("row", {
            name: new RegExp(testClassName, "i"),
        });

        await expect(classRow).toBeVisible();

        // Edit class
        const editLink = classRow.getByRole("link", { name: /edit/i });
        await expect(editLink).toBeVisible();

        await editLink.click();
        await expect(page).toHaveURL(/\/admin\/classes\/\d+/);

        const editNameInput = page.locator('input[name="name"]');
        await expect(editNameInput).toBeVisible();

        await editNameInput.fill(updatedClassName);

        const updateButton = page.getByRole("button", {
            name: /simpan|save/i,
        });

        await updateButton.click();

        const updateToast = page.getByText(/berhasil|success/i).first();
        await expect(updateToast).toBeVisible();

        // Wait for redirect back to list.
        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(updateToast).toBeHidden();

        // Delete class
        const searchUpdatedClassesResponse = page.waitForResponse(
            (response) => {
                try {
                    const url = new URL(response.url());

                    return (
                        response.request().method() === "GET" &&
                        response.ok() &&
                        url.pathname.includes("/classes") &&
                        url.searchParams.get("query") === updatedClassName
                    );
                } catch {
                    return false;
                }
            },
        );

        // Search for the newly updated name.
        await searchInput.clear();
        await searchInput.fill(updatedClassName);
        await searchUpdatedClassesResponse;

        const updatedRow = page.getByRole("row", {
            name: new RegExp(updatedClassName, "i"),
        });

        await expect(updatedRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(updatedClassName);
            await confirmDialog.accept();
        });

        const deleteButton = updatedRow.getByRole("button", {
            name: new RegExp(`delete-${updatedClassName}`, "i"),
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(updatedRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        // Search is still applied, so no classes should be found.
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
