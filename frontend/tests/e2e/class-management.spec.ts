import { Page } from "@playwright/test";
import { seededPrimaryData } from "@psb/shared/tests";
import { expect, test } from "./fixtures";
import { loginAdministrator } from "./utils/login";

test.describe("Class Management", () => {
    const session = seededPrimaryData.sessions[0];
    const uniqueSuffix = Date.now().toString().slice(-4);

    // Deliberately avoid the words "edit"/"delete" in these names: the row's action links
    // (edit-, manage-subjects-, manage-schedules-, delete-) all embed the class name in their
    // aria-label, so a class name containing "Edit" would make the generic /edit/i locator
    // match unrelated action links too.
    const editClassName = `X E2E Modify ${uniqueSuffix}`;
    const updatedClassName = `XI E2E Modify ${uniqueSuffix} UP`;
    const deleteClassName = `X E2E Remove ${uniqueSuffix}`;

    test.beforeAll(async ({ workerSetup }) => {
        const { seeders } = workerSetup.dbManager;

        await seeders.classes.seedMany(
            {
                name: editClassName,
                session: session.session,
                semester: session.semester,
            },
            {
                name: deleteClassName,
                session: session.session,
                semester: session.semester,
            },
        );
    });

    test.afterAll(async ({ workerSetup }) => {
        await workerSetup.dbManager.cleanupSecondaryTables();
    });

    test.beforeEach(async ({ page }) => {
        await loginAdministrator(page);

        const dashboardCard = page
            .locator('a[href="/admin/classes"]')
            .filter({ hasText: /Atur ruang kelas untuk/i });

        await dashboardCard.click();

        await expect(page).toHaveURL(/\/admin\/classes/);
        await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
    });

    async function searchClass(page: Page, query: string) {
        const searchInput = page.locator('input[name="search"]');

        const searchClassesResponse = page.waitForResponse((response) => {
            try {
                const url = new URL(response.url());

                return (
                    response.request().method() === "GET" &&
                    response.ok() &&
                    url.pathname.includes("/classes") &&
                    url.searchParams.get("query") === query
                );
            } catch {
                return false;
            }
        });

        await searchInput.clear();
        await searchInput.fill(query);
        await searchClassesResponse;
    }

    test("should allow creating a class", async ({ page }) => {
        const testClassName = `X E2E Create ${uniqueSuffix}`;

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
        await expect(dialog).toBeHidden({ timeout: 10000 });

        await searchClass(page, testClassName);

        const classRow = page.getByRole("row", {
            name: new RegExp(testClassName, "i"),
        });

        await expect(classRow).toBeVisible();
    });

    test("should allow editing a class", async ({ page }) => {
        await searchClass(page, editClassName);

        const classRow = page.getByRole("row", {
            name: new RegExp(editClassName, "i"),
        });

        await expect(classRow).toBeVisible();

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

        await searchClass(page, updatedClassName);

        const updatedRow = page.getByRole("row", {
            name: new RegExp(updatedClassName, "i"),
        });

        await expect(updatedRow).toBeVisible();
    });

    test("should allow deleting a class", async ({ page }) => {
        await searchClass(page, deleteClassName);

        const classRow = page.getByRole("row", {
            name: new RegExp(deleteClassName, "i"),
        });

        await expect(classRow).toBeVisible();

        page.once("dialog", async (confirmDialog) => {
            expect(confirmDialog.message()).toContain(deleteClassName);
            await confirmDialog.accept();
        });

        const deleteButton = classRow.getByRole("button", {
            name: new RegExp(`delete-${deleteClassName}`, "i"),
        });

        await deleteButton.click();

        const deleteToast = page.getByText(/berhasil|success/i).last();

        await expect(deleteToast).toBeVisible();
        await expect(classRow).toBeHidden();
        await expect(deleteToast).toBeHidden();

        // Search is still applied, so no classes should be found.
        await expect(page.locator("table")).toContainText(/tidak ada|empty/i);
    });
});
